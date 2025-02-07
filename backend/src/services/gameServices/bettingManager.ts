import mongoose, { Types } from "mongoose";
import { BettingError } from "../../utils/errors/bettingError";
import User from "../../models/user";
import BetHistory, { BetState } from "../../models/game/betHistory";
import { CashoutError } from "../../utils/errors/cashoutError";
import SessionAnalytics from "../../models/game/gameSessionAnalytics";
import {
  BETTING_ERRORS,
  CASHOUT_ERRORS,
  USER_ERRORS,
} from "../../config/errorConfig";
import GameSessionManager from "./gameSessionManager";

interface BettingManagerDependancies {
  gameSession: GameSessionManager;
}

export interface BettingResult {
  betId: string;
  stake: number;
  accountBalance: number;
  username: string;
  userId: string;
}

export interface CashoutResult {
  betId: Types.ObjectId;
  cashoutMultiplier: number;
  payout: number;
  accountBalance: number;
}

export interface BettingDataToProcess {
  stake: number;
  userId: string;
}

export interface CashoutDataToProcess {
  cashoutMultiplier: number;
  betId: string;
}

class BettingManager {
  private gameSession: GameSessionManager;

  constructor(dependancies: BettingManagerDependancies) {
    this.gameSession = dependancies.gameSession;
  }

  //database transactions with rollback on failure
  private async withTransaction<T>(
    operation: (session: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  placeBet(bettingDataToProcess: BettingDataToProcess): Promise<BettingResult> {
    return this.withTransaction(async (session) => {
      try {
        const { userId, stake } = bettingDataToProcess;

        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new BettingError({
            description: USER_ERRORS.NOT_FOUND,
          });
        }

        if (stake > user.balance) {
          throw new BettingError({
            description: BETTING_ERRORS.INSUFFICIENT_BALANCE,
          });
        }

        user.balance -= stake;
        await user.save({ session });

        // Create new bet record
        const [newBet] = await BetHistory.create(
          [
            {
              userId,
              stake,
              payout: 0,
              status: BetState.ACTIVE,
              sessionId: this.gameSession.getSessionId().sessionId,
            },
          ],
          { session }
        );

        return {
          userId,
          stake: newBet.stake,
          username: user.username,
          betId: newBet._id.toString(),
          accountBalance: user.balance,
        };
      } catch (err) {
        throw err;
      }
    });
  }

  cashout(cashoutDataToProcess: CashoutDataToProcess): Promise<CashoutResult> {
    return this.withTransaction(async (session) => {
      try {
        const { betId, cashoutMultiplier } = cashoutDataToProcess;

        const bet = await BetHistory.findOne({
          _id: betId,
          sessionId: this.gameSession.getSessionId().sessionId,
        }).session(session);

        if (!bet) {
          throw new CashoutError({
            description: CASHOUT_ERRORS.BET_NOT_FOUND,
          });
        }

        if (bet.status !== BetState.ACTIVE) {
          throw new CashoutError({
            description: CASHOUT_ERRORS.BET_ALREADY_SETTLED,
          });
        }

        const user = await User.findById(bet.userId).session(session);
        if (!user) {
          throw new CashoutError({
            description: USER_ERRORS.NOT_FOUND,
          });
        }

        // Calculate payout
        const payout = parseFloat((cashoutMultiplier * bet.stake).toFixed(2));

        const [, updatedUser] = await Promise.all([
          BetHistory.updateOne(
            { _id: bet._id },
            {
              $set: {
                payout,
                status: BetState.CASHEDOUT,
                cashoutMultiplier: cashoutMultiplier,
              },
            },
            { session }
          ),
          User.findOneAndUpdate(
            { _id: user._id },
            { $inc: { balance: payout } },
            { new: true, session, select: "balance" }
          ),
          SessionAnalytics.updateOne(
            { sessionId: this.gameSession.getSessionId().sessionId },
            { $inc: { totalCashoutAmount: payout } },
            { session }
          ),
        ]);

        return {
          payout,
          betId: bet._id,
          cashoutMultiplier,
          accountBalance: updatedUser ? updatedUser.balance : user.balance,
        };
      } catch (err) {
        throw err;
      }
    });
  }
}

export default BettingManager;
