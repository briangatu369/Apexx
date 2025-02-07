import mongoose, { Document, Schema } from "mongoose";

export enum GamePhase {
  PREPARING = "PREPARING",
  RUNNING = "RUNNING",
  CRASHED = "CRASHED",
  BETTING = "BETTING",
  ERROR = "ERROR",
}

export enum RoundOutcome {
  PROFIT = "PROFIT",
  LOSS = "LOSS",
  BREAK_EVEN = "BREAK_EVEN",
  PENDING = "PENDING",
}

export interface ClientSeedDetails {
  username: string;
  clientSeed: string;
}

export interface GameSession {
  readonly sessionId: string;
  gamePhase: GamePhase;
  serverSeed: string;
  hashedServerSeed: string;
  clientSeedDetails: ClientSeedDetails[];
  clientSeed: string;
  gameSessionHash: string;
  rawCrashPoint: number | null;
  finalCrashPoint: number | null;
  totalPlayers: number;
  totalBetAmount: number;
  totalCashoutAmount: number;
  totalProfit: number;
  profited?: RoundOutcome;

  calculateProfit: () => Promise<void>;
}

interface GameSessionDocument extends GameSession, Document {
  rawCrashPoint: number;
  finalCrashPoint: number;
  createdAt: Date;
  updatedAt: Date;
}

const gameSessionAnalyticsSchema = new Schema<GameSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profited: {
      type: String,
      enum: Object.values(RoundOutcome),
      required: true,
      default: RoundOutcome.PENDING,
    },
    totalBetAmount: { type: Number, required: true },
    totalCashoutAmount: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    gamePhase: {
      type: String,
      required: true,
      enum: Object.values(GamePhase),
      default: GamePhase.PREPARING,
    },
    serverSeed: { type: String, required: true },
    hashedServerSeed: { type: String, required: true },
    clientSeed: { type: String, required: true },
    clientSeedDetails: {
      type: [{ username: String, clientSeed: String }],
      required: true,
    },
    gameSessionHash: { type: String, required: true },
    rawCrashPoint: { type: Number, required: true, min: 1 },
    finalCrashPoint: { type: Number, required: true, min: 1 },
    totalPlayers: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Calculated when the game session ends.
gameSessionAnalyticsSchema.methods.calculateProfit =
  async function (): Promise<void> {
    const sessionAnalytics = this;
    const { totalBetAmount, totalCashoutAmount } = sessionAnalytics;

    const profitStatus =
      totalCashoutAmount > totalBetAmount
        ? {
            totalProfit: totalBetAmount - totalCashoutAmount,
            profited: RoundOutcome.LOSS,
          }
        : totalCashoutAmount === totalBetAmount
        ? { totalProfit: 0, profited: RoundOutcome.BREAK_EVEN }
        : {
            totalProfit: totalBetAmount - totalCashoutAmount,
            profited: RoundOutcome.PROFIT,
          };

    await sessionAnalytics.updateOne({
      totalProfit: profitStatus.totalProfit,
      profited: profitStatus.profited,
      gamePhase: GamePhase.CRASHED,
    });
  };

const SessionAnalytics = mongoose.model<GameSessionDocument>(
  "SessionAnalytics",
  gameSessionAnalyticsSchema
);

export default SessionAnalytics;
