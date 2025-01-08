import mongoose from "mongoose";
import { Document } from "mongoose";
import { GameState } from "./sessionAnalytics";

interface BetHistoryI extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  sessionId: string;
  betAmount: number;
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
    status: { enum: Object.values(GameState), default: GameState.RUNNING },
    betAmount: { type: Number, required: true },
    cashoutMultiplier: { type: Number, default: null },
    payout: { type: Number, default: null },
  },
  { timestamps: true }
);

const BetHistory = mongoose.model<BetHistoryI>("BetHistory", betHistorySchema);

export default BetHistory;
