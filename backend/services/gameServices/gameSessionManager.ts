import MultiplierGenerator from "./multiplierGenerator";
import { v4 as uuidv4 } from "uuid";
import { GameSession, GameState } from "../../models/game/sessionAnalytics";
import { Server, Socket } from "socket.io";
import SessionAnalytics from "../../models/game/sessionAnalytics";
import ioEvents from "../../config/eventsConfig";
import User from "../../models/user";
import BetHistory, { BetState } from "../../models/game/betHistory";
import NotFoundError from "../../utils/errors/notFoundError";
import mongoose, { Types } from "mongoose";
import InvalidDataError from "../../utils/errors/invalidDataError";
import { betValidationSchema } from "../../validation/gameRequestValidation";

interface BettingInfo {
  userId: string;
  stake: number;
}

class GameSessionManager extends MultiplierGenerator {
  private readonly sessionData: GameSession;
  private bettingQueue: BettingInfo[] = [];
  private isProcessing = false;
  private cashoutQueue: string[] = [];
  private isProcessingCashouts = false;
  private currentMultiplier = 1;

  constructor() {
    super();
    this.sessionData = this.initializeSessionData();
  }

  private initializeSessionData(): GameSession {
    return {
      sessionId: uuidv4(),
      state: GameState.RUNNING,
      roundNumber: 0,
      serverSeed: "",
      hashedServerSeed: "",
      clientSeed: "",
      sessionHash: "",
      multiplier: null,
      finalMultiplier: null,
      players: [
        {
          userId: new Types.ObjectId("67619d35de831919d1c31147"),
          sessionId: "9777bae6-5553-4959-9fae-d12099e0c25a",
          username: "123456",
          stake: 10,
          cashoutMultiplier: null,
          payout: null,
          betId: new Types.ObjectId("678511ffd5fab0ff749e313c"),
        },
      ],
      totalPlayers: 0,
    };
  }

  async startGameSession(io: Server) {
    try {
      super.generateServerSeed();

      io.emit(ioEvents.emitters.game.broadcastHashedServerseed, {
        hashedServerSeed: this.multiplierData.hashedServerSeed,
      });

      super.generateGameHash("clientSeed-simulation");
      super.calculateMultiplier();

      if (this.sessionData.players.length === 0) {
        const game = await SessionAnalytics.findOne({
          sessionId: this.sessionData.sessionId,
        });

        if (game) {
          throw new Error("Game session already exist in database");
        }
      }
      //  continue with the game

      //broadcast the game
      let t = setInterval(() => {
        if (this.currentMultiplier >= this.multiplierData.finalMultiplier!) {
          this.startGameSession(io);
          clearInterval(t);
          //restart the game
          return;
        }

        this.currentMultiplier += 0.01;
        //broadcast the multipliers to all clients
        io.emit(ioEvents.emitters.game.broadcastCurrentMultiplier, {
          currentMultiplier: this.currentMultiplier,
        });

        console.log(this.calculateMultiplier);
      }, 10);
    } catch (error) {}
  }

  async placeBet(socket: Socket, betInfo: BettingInfo) {
    try {
      if (this.sessionData.state !== GameState.WAITING) {
        throw new Error("Cannot place bet while game is in progress");
      }

      const { error } = betValidationSchema.validate(betInfo);
      if (error) {
        throw new InvalidDataError(error.details[0].message);
      }

      this.bettingQueue.push(betInfo);

      if (this.isProcessing || this.bettingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      while (this.bettingQueue.length > 0) {
        const currentBet = this.bettingQueue[0];
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const user = await User.findById(currentBet.userId).session(session);

          if (!user) {
            throw new NotFoundError("User not found");
          }

          if (currentBet.stake > user.balance) {
            throw new InvalidDataError("Insufficient balance");
          }

          user.balance -= currentBet.stake;
          await user.save({ session });

          const newBet = new BetHistory({
            userId: currentBet.userId,
            sessionId: this.sessionData.sessionId,
            stake: currentBet.stake,
            payout: 0,
          });

          await newBet.save({ session });

          this.sessionData.players.push({
            userId: new Types.ObjectId(currentBet.userId),
            sessionId: this.sessionData.sessionId,
            username: user.username,
            stake: currentBet.stake,
            cashoutMultiplier: null,
            payout: null,
            betId: newBet._id,
          });

          await session.commitTransaction();
          console.log(this.sessionData.players);
        } catch (error) {
          await session.abortTransaction();
          console.log(error);
        } finally {
          session.endSession();
          this.bettingQueue.shift();
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async cashout(socket: Socket, betId: string) {
    try {
      const cashoutMultiplier = this.currentMultiplier;

      if (!betId) {
        throw new InvalidDataError("Bet Id was not provided");
      }

      if (this.sessionData.state !== GameState.RUNNING) {
        throw new Error("Invalid action. Game must be running");
      }

      this.cashoutQueue.push(betId);

      if (this.isProcessingCashouts || this.cashoutQueue.length === 0) {
        return;
      }

      this.isProcessingCashouts = true;

      while (this.cashoutQueue.length > 0) {
        const currentCashout = this.cashoutQueue[0];
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const bet = await BetHistory.findOne({
            _id: currentCashout,
            // sessionId: this.sessionData.sessionId,
          }).session(session);

          if (!bet) {
            throw new NotFoundError("This bet was not found.");
          }

          if (bet.status !== BetState.ACTIVE) {
            throw new InvalidDataError("Bet already settled.");
          }

          // find user
          const user = await User.findById(bet.userId).session(session);

          if (!user) {
            throw new NotFoundError("User not found.");
          }

          // Calculate updates
          const payout = cashoutMultiplier * bet.stake;
          const newBalance = user.balance + payout;

          // parallel updates
          await Promise.all([
            // Update bet document
            BetHistory.updateOne(
              { _id: bet._id },
              {
                $set: {
                  cashoutMultiplier,
                  payout,
                  // status: BetState.CASHEDOUT,
                },
              },
              { session }
            ),

            // Update user balance
            User.updateOne(
              { _id: user._id },
              { $set: { balance: newBalance } },
              { session }
            ),
          ]);

          // Update session data
          const playerIndex = this.sessionData.players.findIndex(
            (player) => player.betId.toString() === bet._id.toString()
          );

          if (playerIndex !== -1) {
            this.sessionData.players[playerIndex].cashoutMultiplier =
              cashoutMultiplier;
            this.sessionData.players[playerIndex].payout = payout;
          }

          await session.commitTransaction();

          console.log(this.sessionData, 1);
          // Emit success with updated data
          // socket.emit("cashoutSuccess", {
          //   betId: bet._id,
          //   multiplier: cashoutMultiplier,
          //   payout,
          // });
        } catch (error) {
          await session.abortTransaction();
          console.error("Cashout error:", error);
          // socket.emit("cashoutError", {
          //   message: error instanceof Error ? error.message : "Cashout failed",
          // });
        } finally {
          session.endSession();
          this.cashoutQueue.shift();
        }
      }
    } catch (error) {
      console.error("Cashout processing error:", error);
      socket.emit("cashoutError", {
        message:
          error instanceof Error ? error.message : "Cashout processing failed",
      });
    } finally {
      this.isProcessingCashouts = false;
    }
  }
}

export default GameSessionManager;
