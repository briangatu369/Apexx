import mongoose, { Types } from "mongoose";
import SessionAnalytics, {
  GamePhase,
} from "../../models/game/sessionAnalytics";
import { betValidationSchema } from "../../validation/gameRequestValidation";
import InvalidDataError from "../../utils/errors/invalidDataError";
import User from "../../models/user";
import NotFoundError from "../../utils/errors/notFoundError";
import BetHistory, { BetState } from "../../models/game/betHistory";

interface BettingQueue {
  bettingQueue: BettingInfo[];
  cashoutQueue: string[];
  isProcessingBetting: boolean;
  isProcessingCashouts: boolean;
}

export interface BettingInfo {
  userId: string;
  stake: number;
}

export interface BettingResult {
  betId: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  stake: number;
}

export interface CashoutResult {
  betId: Types.ObjectId;
  userId: Types.ObjectId;
  multiplier: number;
  payout: number;
}

class BettingManager {
  private queue: BettingQueue;
  private sessionId: string;
  private onBetComplete: (result: BettingResult) => void;
  private onCashoutComplete: (result: CashoutResult) => void;

  constructor(
    sessionId: string,
    onBetComplete: (result: BettingResult) => void,
    onCashoutComplete: (result: CashoutResult) => void
  ) {
    this.sessionId = sessionId;
    this.onBetComplete = onBetComplete;
    this.onCashoutComplete = onCashoutComplete;
    this.queue = {
      bettingQueue: [],
      cashoutQueue: [],
      isProcessingBetting: false,
      isProcessingCashouts: false,
    };
  }

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

  async placeBet(betInfo: BettingInfo, gamePhase: GamePhase): Promise<any> {
    try {
      if (gamePhase !== GamePhase.WAITING) {
        throw new Error("Cannot place bet while game is in progress");
      }

      const { error } = betValidationSchema.validate(betInfo);
      if (error) {
        throw new InvalidDataError(error.details[0].message);
      }

      await this.processBet(betInfo);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err || "An error occurred during betting",
      };
    }
  }

  async cashout(
    betId: string,
    gamePhase: GamePhase,
    currentMultiplier: number
  ): Promise<any> {
    try {
      if (!betId) {
        throw new InvalidDataError("Bet Id was not provided");
      }

      if (gamePhase !== GamePhase.RUNNING) {
        throw new Error("Invalid action. Game must be running");
      }

      await this.processCashout(betId, currentMultiplier);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err || "An error occurred during betting",
      };
    }
  }

  private async processBet(betInfo: BettingInfo): Promise<void> {
    this.queue.bettingQueue.push(betInfo);

    if (
      this.queue.isProcessingBetting ||
      this.queue.bettingQueue.length === 0
    ) {
      return;
    }

    this.queue.isProcessingBetting = true;
    try {
      while (this.queue.bettingQueue.length > 0) {
        const currentBet = this.queue.bettingQueue[0];
        const result = await this.executeBetTransaction(currentBet);
        this.onBetComplete(result);
        this.queue.bettingQueue.shift();
      }
    } finally {
      this.queue.isProcessingBetting = false;
    }
  }

  private async processCashout(
    betId: string,
    multiplier: number
  ): Promise<void> {
    this.queue.cashoutQueue.push(betId);

    if (
      this.queue.isProcessingCashouts ||
      this.queue.cashoutQueue.length === 0
    ) {
      return;
    }

    this.queue.isProcessingCashouts = true;
    try {
      while (this.queue.cashoutQueue.length > 0) {
        const currentCashout = this.queue.cashoutQueue[0];
        const result = await this.executeCashoutTransaction(
          currentCashout,
          multiplier
        );
        this.onCashoutComplete(result); // Notify GameSessionManager immediately after successful cashout
        this.queue.cashoutQueue.shift();
      }
    } finally {
      this.queue.isProcessingCashouts = false;
    }
  }

  private async executeBetTransaction(
    bet: BettingInfo
  ): Promise<BettingResult> {
    return this.withTransaction(async (session) => {
      const user = await User.findById(bet.userId).session(session);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (bet.stake > user.balance) {
        throw new InvalidDataError("Insufficient balance");
      }

      user.balance -= bet.stake;
      await user.save({ session });

      const [newBet] = await BetHistory.create(
        [
          {
            userId: bet.userId,
            sessionId: this.sessionId,
            stake: bet.stake,
            payout: 0,
            status: BetState.ACTIVE,
          },
        ],
        { session }
      );

      return {
        betId: newBet._id,
        userId: new Types.ObjectId(bet.userId),
        username: user.username,
        stake: bet.stake,
      };
    });
  }

  private async executeCashoutTransaction(
    betId: string,
    multiplier: number
  ): Promise<CashoutResult> {
    return this.withTransaction(async (session) => {
      const bet = await BetHistory.findOne({
        _id: betId,
        sessionId: this.sessionId,
      }).session(session);

      if (!bet) {
        throw new NotFoundError("Bet was not found.");
      }
      if (bet.status !== BetState.ACTIVE) {
        throw new InvalidDataError("Bet already settled.");
      }

      const user = await User.findById(bet.userId).session(session);
      if (!user) {
        throw new NotFoundError("User not found.");
      }

      const payout = multiplier * bet.stake;

      await Promise.all([
        BetHistory.updateOne(
          { _id: bet._id },
          {
            $set: {
              cashoutMultiplier: multiplier,
              payout,
              status: BetState.CASHEDOUT,
            },
          },
          { session }
        ),
        User.updateOne(
          { _id: user._id },
          { $inc: { balance: payout } },
          { session }
        ),
        SessionAnalytics.updateOne(
          { sessionId: this.sessionId },
          { $inc: { totalCashoutAmount: payout } },
          { session }
        ),
      ]);

      return {
        betId: bet._id,
        userId: bet.userId,
        multiplier,
        payout,
      };
    });
  }
}

export default BettingManager;
