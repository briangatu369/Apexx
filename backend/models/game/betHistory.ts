import mongoose, { Types } from "mongoose";
import { Document } from "mongoose";

export enum BetState {
  CASHEDOUT = "cashedout",
  ACTIVE = "active",
  BUSTED = "busted",
}

interface BetHistoryI extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  betId: string;
  sessionId: string;
  stake: number;
  status: BetState;
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
      enum: Object.values(BetState),
      default: BetState.ACTIVE,
    },
    stake: { type: Number, required: true },
    cashoutMultiplier: { type: Number, default: null },
    payout: { type: Number, default: null },
  },
  { timestamps: true }
);

const BetHistory = mongoose.model<BetHistoryI>("BetHistory", betHistorySchema);

export default BetHistory;
