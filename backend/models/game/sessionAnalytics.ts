import mongoose, { Document } from "mongoose";

export enum GameState {
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  CRASHED = "CRASHED",
}

// Base interfaces that can be used anywhere
export interface Player {
  readonly playerId: string;
  readonly username: string;
  readonly betAmount: number;
  cashoutMultiplier: number | null;
  cashoutAmount: number | null;
  profitOrLoss: number | null;
  cashoutTime: Date | null;
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

export interface GameSessionDocument extends GameSession, Document {}

const PlayerSchema = new mongoose.Schema<Player>({
  playerId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  betAmount: {
    type: Number,
    required: true,
  },
  cashoutMultiplier: {
    type: Number,
    default: null,
  },
  cashoutAmount: {
    type: Number,
    default: null,
  },
  profitOrLoss: {
    type: Number,
    default: null,
  },
  cashoutTime: {
    type: Date,
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
      type: [PlayerSchema],
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
