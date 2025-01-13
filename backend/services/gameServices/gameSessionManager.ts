import MultiplierGenerator from "./multiplierGenerator";
import { v4 as uuidv4 } from "uuid";
import { GameSession, GameState } from "../../models/game/sessionAnalytics";
import { Server, Socket } from "socket.io";
import SessionAnalytics from "../../models/game/sessionAnalytics";
import ioEvents from "../../config/eventsConfig";
import User from "../../models/user";
import BetHistory from "../../models/game/betHistory";
import NotFoundError from "../../utils/errors/notFoundError";
import mongoose from "mongoose";
import InvalidDataError from "../../utils/errors/invalidDataError";
import { betValidationSchema } from "../../validation/gameRequestValidation";

interface BettingInfo {
  userId: string;
  stake: number;
}

class GameSessionManager extends MultiplierGenerator {
  private readonly sessionData: GameSession;
  private bettingQueue: BettingInfo[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.sessionData = this.initializeSessionData();
  }

  private initializeSessionData(): GameSession {
    return {
      sessionId: uuidv4(),
      state: GameState.WAITING,
      roundNumber: 0,
      serverSeed: "",
      hashedServerSeed: "",
      clientSeed: "",
      sessionHash: "",
      multiplier: null,
      finalMultiplier: null,
      players: [],
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

      let currentMultiplier = 1;

      //broadcast the game
      let t = setInterval(() => {
        if (currentMultiplier >= this.multiplierData.finalMultiplier!) {
          this.startGameSession(io);
          clearInterval(t);
          //restart the game
          return;
        }

        currentMultiplier += 0.01;
        //broadcast the multipliers to all clients
        io.emit(ioEvents.emitters.game.broadcastCurrentMultiplier, {
          currentMultiplier,
        });

        console.log(currentMultiplier);
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

      try {
        while (this.bettingQueue.length > 0) {
          const currentBet = this.bettingQueue[0];
          const session = await mongoose.startSession();

          session.startTransaction();

          try {
            const user = await User.findById(currentBet.userId).session(
              session
            );

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
              userId: currentBet.userId,
              sessionId: this.sessionData.sessionId,
              username: user.username,
              stake: currentBet.stake,
              cashoutMultiplier: null,
              payout: null,
              betId: newBet._id,
            });

            await session.commitTransaction();
          } catch (error) {
            await session.abortTransaction();
            console.log(error);
          } finally {
            session.endSession();
            this.bettingQueue.shift();
          }
        }
      } finally {
        this.isProcessing = false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async cashout(socket: Socket, userId: string) {
    // Implement cashout logic here
  }
}

export default GameSessionManager;
