import { Server } from "socket.io";
import MultiplierGenerator from "./multiplierGenerator";
import { GAME_SESSION_EVENT_NAMES } from "../../config/eventNamesConfig";
import SessionAnalytics, {
  ClientSeedDetails,
  GamePhase,
} from "../../models/game/gameSessionAnalytics";
import { v4 as uuidv4 } from "uuid";
import SOCKET_EVENT_NAMES from "../../config/socketNamesConfig";
import mongoose from "mongoose";
import BetHistory, { BetState } from "../../models/game/betHistory";
import GameError from "../../utils/errors/gameError";
import User from "../../models/user";
import EventEmitter from "events";
import { RefundsSummary } from "../../models/game/refundAnalytics";

interface GameSessionSchedulers {
  intervals: Record<string, NodeJS.Timeout | null>;
  timeouts: Record<string, NodeJS.Timeout | null>;
}

export interface BetInMemory {
  userId: string;
  username: string;
  stake: number;
  cashoutMultiplier: number | null;
  payout: number | null;
}

interface GameSessionInMemory {
  readonly sessionId: string;
  clientSeed: string;
  clientSeedDetails: ClientSeedDetails[];
  gamePhase: GamePhase;
  bets: BetInMemory[];
  totalBetAmount: number;
  totalPlayers: number;
  currentMultiplier: number;
}

interface GameSessionManagerDependancies {
  io: Server;
  gameEventEmitter: EventEmitter;
}

const schedulers: GameSessionSchedulers = {
  intervals: {
    multiplierCountUp: null,
    nextGameCountDown: null,
  },
  timeouts: {
    nextGameDelay: null,
  },
};

export interface PreviousMultiplier {
  finalMultiplier: number;
  sessionId: string;
}

class GameSessionManager {
  private readonly MAX_RETRIES = 3;
  private readonly MAXIMUM_CLIENT_SEED_TO_USE = 3;
  private TIME_TO_NEXT_SESSION = 4;

  private io: Server;
  private gameEventEmitter: EventEmitter;
  private sessionData: GameSessionInMemory;
  private multiplierGenerator: MultiplierGenerator;

  private isCashoutComplete = false;
  private hasCashoutStarted = false;
  private isBettingComplete = false;
  private hasBettingStarted = false;

  constructor({ io, gameEventEmitter }: GameSessionManagerDependancies) {
    this.io = io;
    this.sessionData = this.initializeSessionData();
    this.multiplierGenerator = new MultiplierGenerator(); //contains all multiplier data
    this.gameEventEmitter = gameEventEmitter;

    //listeners
    this.gameEventEmitter.on(GAME_SESSION_EVENT_NAMES.cashoutStart, () => {
      this.hasCashoutStarted = true;
    });
    this.gameEventEmitter.on(GAME_SESSION_EVENT_NAMES.cashoutComplete, () => {
      this.isCashoutComplete = true;
    });
    this.gameEventEmitter.on(GAME_SESSION_EVENT_NAMES.bettingStarted, () => {
      this.hasBettingStarted = true;
    });
    this.gameEventEmitter.on(GAME_SESSION_EVENT_NAMES.bettingComplete, () => {
      this.isBettingComplete = true;
    });
  }

  private initializeSessionData(): GameSessionInMemory {
    return {
      sessionId: uuidv4(),
      clientSeed: "",
      clientSeedDetails: [],
      gamePhase: GamePhase.BETTING,
      totalBetAmount: 0,
      totalPlayers: 0,
      bets: [],
      currentMultiplier: 1,
    };
  }

  async startGameSession() {
    try {
      this.clearAllSchedulers();
      this.sessionData.gamePhase = GamePhase.PREPARING;
      this.io.emit(SOCKET_EVENT_NAMES.emitters.game.gamePhases.preparing, {
        gamePhase: GamePhase.PREPARING,
      });

      const { hashedServerSeed } =
        this.multiplierGenerator.generateServerSeed();
      this.io.emit(SOCKET_EVENT_NAMES.emitters.game.broadcastHashedServerseed, {
        hashedServerSeed,
      });

      this.sessionData.clientSeed =
        this.sessionData.bets.length > 0 &&
        this.sessionData.clientSeedDetails.length > 0
          ? this.sessionData.clientSeed
          : "family";

      //finalize calculating game results
      this.multiplierGenerator.generateGameHash(this.sessionData.clientSeed);
      this.multiplierGenerator.calculateCrashPoint();

      // Process all bets in the betting queue
      if (this.hasBettingStarted) {
        while (!this.isBettingComplete) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        this.hasBettingStarted = false;
        this.isBettingComplete = false;
      }

      // Save session analytics if bets were made.
      if (this.sessionData.bets.length > 0) {
        await this.saveGameSessionAnalyticsWithRetries();
      }

      this.sessionData.gamePhase = GamePhase.RUNNING;
      schedulers.intervals.multiplierCountUp = setInterval(async () => {
        this.incrementMultiplier();
      }, 50);
    } catch (err) {
      this.clearAllSchedulers();
      this.io.emit("GameError", {
        errorMessage:
          "Something went wrong on our end. We're working on fixing it.",
      });
      console.error(err);
    }
  }

  private incrementMultiplier() {
    try {
      const growthRate = 0.0035;
      const increment = this.sessionData.currentMultiplier * growthRate;
      this.sessionData.currentMultiplier += increment;

      if (
        this.sessionData.currentMultiplier >=
        this.multiplierGenerator.multiplierData.finalCrashPoint!
      ) {
        clearInterval(schedulers.intervals.multiplierCountUp as NodeJS.Timeout);
        this.endSession();
        return;
      }

      this.io.emit(
        SOCKET_EVENT_NAMES.emitters.game.broadcastCurrentMultiplier,
        {
          gamePhase: this.sessionData.gamePhase,
          currentMultiplier: this.sessionData.currentMultiplier,
          hashedServerSeed:
            this.multiplierGenerator.multiplierData.hashedServerSeed,
        }
      );
    } catch (err) {
      console.error("Error running CURRENT_MULTIPLIER:", err);
      throw err;
    }
  }

  private async endSession() {
    clearInterval(schedulers.intervals.multiplierCountUp as NodeJS.Timeout);
    this.sessionData.gamePhase = GamePhase.CRASHED;
    const crashedMultiplierInfo: PreviousMultiplier = {
      sessionId: this.sessionData.sessionId,
      finalMultiplier: this.multiplierGenerator.multiplierData.finalCrashPoint!,
    };

    this.io.emit(SOCKET_EVENT_NAMES.emitters.game.gamePhases.crashed, {
      gamePhase: this.sessionData.gamePhase,
      crashedMultiplierInfo,
    });

    // Wait for all cashouts in queue to complete
    if (this.hasCashoutStarted) {
      while (!this.isCashoutComplete) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    this.isCashoutComplete = false;
    this.hasCashoutStarted = false;

    if (this.sessionData.bets.length > 0) {
      this.processEndOfSession();
    }

    //simulate delay for better user experience
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.gameEventEmitter.emit(
      GAME_SESSION_EVENT_NAMES.sessionEnd,
      crashedMultiplierInfo
    );

    //reset session states
    this.multiplierGenerator.resetMultiplierData();
    this.sessionData = this.initializeSessionData();

    this.io.emit(SOCKET_EVENT_NAMES.emitters.game.nextGameCountDown, {
      gamePhase: this.sessionData.gamePhase,
      timeToNextSession: this.TIME_TO_NEXT_SESSION,
    });

    schedulers.intervals.nextGameCountDown = setInterval(() => {
      try {
        if (this.TIME_TO_NEXT_SESSION <= 0) {
          clearInterval(
            schedulers.intervals.nextGameCountDown as NodeJS.Timeout
          );

          this.TIME_TO_NEXT_SESSION = 4;
          this.startGameSession();

          return;
        }

        this.TIME_TO_NEXT_SESSION -= 0.1;
        this.TIME_TO_NEXT_SESSION = parseFloat(
          this.TIME_TO_NEXT_SESSION.toFixed(2)
        );

        //emit time before next game to all clients
        this.io.emit(SOCKET_EVENT_NAMES.emitters.game.nextGameCountDown, {
          gamePhase: this.sessionData.gamePhase,
          timeToNextSession: this.TIME_TO_NEXT_SESSION,
        });
      } catch (err) {
        console.error("Unexpected error in NEXT_SESSION_COUNTDOWN:", err);
        throw err;
      }
    }, 100);
  }

  private async processEndOfSession() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await BetHistory.updateMany(
        {
          sessionId: this.sessionData.sessionId,
          status: { $nin: [BetState.REFUNDED, BetState.CASHEDOUT] },
        },
        { status: BetState.BUSTED },
        { session }
      );

      const sessionAnalytics = await SessionAnalytics.findOne(
        { sessionId: this.sessionData.sessionId },
        null,
        { session }
      );
      if (!sessionAnalytics)
        throw new GameError({
          internalDetails: "Session analytics not found.",
        });

      await sessionAnalytics.calculateProfit();
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error("Error in end session processing:", err);
      throw err;
    } finally {
      session.endSession();
    }
  }

  private async saveGameSessionAnalyticsWithRetries(
    retries = 1,
    maxRetries = this.MAX_RETRIES
  ) {
    try {
      const totalBetAmount = this.sessionData.bets.reduce(
        (total, bet) => total + bet.stake,
        0
      );

      this.sessionData.totalBetAmount = totalBetAmount;
      const multiplierInfo = this.multiplierGenerator.multiplierData;

      const newSessionAnalytics = new SessionAnalytics({
        sessionId: this.sessionData.sessionId,
        gamePhase: GamePhase.RUNNING,
        totalBetAmount: this.sessionData.totalBetAmount,
        totalPlayers: this.sessionData.bets.length,
        clientSeedDetails: this.sessionData.clientSeedDetails,
        clientSeed: this.sessionData.clientSeed,
        serverSeed: multiplierInfo.serverSeed,
        hashedServerSeed: multiplierInfo.hashedServerSeed,
        gameHash: multiplierInfo.gameHash,
        finalMultiplier: multiplierInfo.finalCrashPoint,
        rawCrashPoint: multiplierInfo.rawCrashPoint,
      });

      await newSessionAnalytics.save();
    } catch (err) {
      if (retries > maxRetries) {
        await this.processRefundsDueToSaveSessionAnalyticsFailure();
        throw new GameError({
          internalDetails: "Refunds processed. Saving game analytics failed.",
        });
      }
      console.error(`save Game analytics Retry Info ${retries}`, err);
      await this.saveGameSessionAnalyticsWithRetries(retries + 1);
    }
  }

  private async processRefundsDueToSaveSessionAnalyticsFailure() {
    let refundsDetails: RefundsSummary = {
      status: "partial",
      totalBetAmount: this.sessionData.totalBetAmount,
      totalAmountRefunded: 0,
      numberOfUsersToRefund: this.sessionData.bets.length,
      numberOfUsersRefunded: 0,
      failedRefunds: [],
      successfulRefunds: [],
      errors: [],
      message: "",
    };

    try {
      // Process refunds sequentially to avoid write conflicts
      for (const currentBet of this.sessionData.bets) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const user = await User.findByIdAndUpdate(
            { _id: currentBet.userId },
            { $inc: { balance: currentBet.stake } },
            { session }
          );

          if (!user) {
            throw new Error(`User ${currentBet.userId} not found for refund`);
          }

          // Update bet history to mark it as refunded
          const bet = await BetHistory.updateOne(
            {
              sessionId: this.sessionData.sessionId,
              status: BetState.ACTIVE,
              userId: currentBet.userId,
            },
            { status: BetState.REFUNDED },
            { session }
          );

          if (bet.modifiedCount <= 0) {
            throw new GameError({
              internalDetails: `Failed to update bet history for user ${currentBet.userId}`,
            });
          }

          await session.commitTransaction();
          refundsDetails.successfulRefunds.push({
            userId: currentBet.userId,
            amount: currentBet.stake,
          });
          refundsDetails.totalAmountRefunded += currentBet.stake;
          refundsDetails.numberOfUsersRefunded++;
        } catch (err) {
          await session.abortTransaction();
          refundsDetails.failedRefunds.push({
            userId: currentBet.userId,
            amount: currentBet.stake,
            error: err.message,
          });
          refundsDetails.errors.push(err.message);
        } finally {
          session.endSession();
        }
      }

      // Set final status
      if (
        refundsDetails.numberOfUsersRefunded ===
        refundsDetails.numberOfUsersToRefund
      ) {
        refundsDetails.status = "success";
        refundsDetails.message = "All refunds processed successfully";
      } else if (refundsDetails.numberOfUsersRefunded === 0) {
        refundsDetails.status = "failed";
        refundsDetails.message = "All refunds failed";
      } else {
        refundsDetails.message = `${refundsDetails.numberOfUsersRefunded} out of ${refundsDetails.numberOfUsersToRefund} refunds processed successfully`;
      }
    } catch (err) {
      console.error("Error in refund processing:", err);
      refundsDetails.status = "failed";
      refundsDetails.errors.push(err.message);
      refundsDetails.message = err.message;
    } finally {
      console.log("Refund Details:", refundsDetails);
    }

    return refundsDetails;
  }

  private clearAllSchedulers() {
    // Stops all intervals and timeouts
    for (const key in schedulers.intervals) {
      if (schedulers.intervals[key]) {
        clearInterval(schedulers.intervals[key] as NodeJS.Timeout);
        schedulers.intervals[key] = null;
      }
    }

    for (const key in schedulers.timeouts) {
      if (schedulers.timeouts[key]) {
        clearTimeout(schedulers.timeouts[key] as NodeJS.Timeout);
        schedulers.timeouts[key] = null;
      }
    }
  }

  getSessionId(): Pick<GameSessionInMemory, "sessionId"> {
    return { sessionId: this.sessionData.sessionId };
  }
  getGamePhase(): Pick<GameSessionInMemory, "gamePhase"> {
    return { gamePhase: this.sessionData.gamePhase };
  }
  getCurrentMultiplier(): Pick<GameSessionInMemory, "currentMultiplier"> {
    return { currentMultiplier: this.sessionData.currentMultiplier };
  }
  getCurrentBets(): Pick<GameSessionInMemory, "bets"> {
    return { bets: this.sessionData.bets };
  }

  updateIsCashoutComplete = (isCashoutComplete: boolean) => {
    this.isCashoutComplete = isCashoutComplete;
  };

  updateSessionClientSeed = (newClientSeed: ClientSeedDetails) => {
    if (!newClientSeed.clientSeed) return;

    if (
      this.sessionData.clientSeedDetails.length >=
      this.MAXIMUM_CLIENT_SEED_TO_USE
    ) {
      return;
    }

    const combinedClientSeed = (
      this.sessionData.clientSeed + newClientSeed.clientSeed
    ).trim();

    this.sessionData.clientSeedDetails.push(newClientSeed);
    this.sessionData.clientSeed = combinedClientSeed;
  };

  addPlayerToSession = (bet: BetInMemory) => {
    this.sessionData.bets.push(bet);
  };
}

export default GameSessionManager;
