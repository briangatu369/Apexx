import mongoose from "mongoose";
import { Document } from "mongoose";
import { GameState } from "./sessionAnalytics";

interface BetHistoryI extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  betId: string;
  sessionId: string;
  stake: number;
  status: GameState;
  cashoutMultiplier: number | null;
  payout: number | null;
}

const betHistorySchema = new mongoose.Schema<BetHistoryI>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(GameState),
      default: GameState.RUNNING,
    },
    stake: { type: Number, required: true },
    cashoutMultiplier: { type: Number, default: null },
    payout: { type: Number, default: null },
  },
  { timestamps: true }
);

const BetHistory = mongoose.model<BetHistoryI>("BetHistory", betHistorySchema);

export default BetHistory;
