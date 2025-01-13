import mongoose, { Document } from "mongoose";

export enum GameState {
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  CRASHED = "CRASHED",
}

enum ProfitStatus {
  PROFIT = "PROFIT",
  LOSS = "LOSS",
  BREAK_EVEN = "BREAK_EVEN",
  PENDING = "PENDING",
}

interface Player {
  userId: string;
  sessionId: string;
  username: string;
  stake: number;
  cashoutMultiplier: number | null;
  payout: number | null;
  betId: string | unknown;
}

export interface GameSession {
  readonly sessionId: string;
  state: GameState;
  roundNumber?: number;
  serverSeed: string;
  hashedServerSeed: string;
  clientSeed: string;
  sessionHash: string;
  multiplier: number | null;
  finalMultiplier: number | null;
  players: Player[];
  totalPlayers: number;
}

interface GameSessionDocument extends GameSession, Document {}

const PlayerSchema = new mongoose.Schema<Player>({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  stake: {
    type: Number,
    required: true,
  },
  cashoutMultiplier: {
    type: Number,
    default: null,
  },
  payout: {
    type: Number,
    default: null,
  },
});

const sessionAnalyticsSchema = new mongoose.Schema<GameSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      enum: Object.values(GameState),
    },
    roundNumber: {
      type: Number,
    },
    serverSeed: {
      type: String,
      required: true,
    },
    hashedServerSeed: {
      type: String,
      required: true,
    },
    clientSeed: {
      type: String,
      required: true,
    },
    sessionHash: {
      type: String,
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      default: null,
    },
    finalMultiplier: {
      type: Number,
      required: true,
      default: null,
    },
    players: {
      type: [],
      required: true,
      default: [],
    },
    totalPlayers: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SessionAnalytics = mongoose.model<GameSessionDocument>(
  "SessionAnalytics",
  sessionAnalyticsSchema
);

export default SessionAnalytics;
