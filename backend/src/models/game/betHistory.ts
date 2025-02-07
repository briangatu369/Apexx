import { Schema, model, Types, Document } from "mongoose";

export enum BetState {
  CASHEDOUT = "cashedout",
  ACTIVE = "active",
  BUSTED = "busted",
  REFUNDED = "refunded",
}

interface BetHistoryI extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  stake: number;
  status: BetState;
  cashoutMultiplier: number | null;
  payout: number | null;
}

const betHistorySchema = new Schema<BetHistoryI>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true },
    stake: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(BetState),
      default: BetState.ACTIVE,
    },
    cashoutMultiplier: { type: Number, default: null },
    payout: { type: Number, default: null },
  },
  { timestamps: true }
);

const BetHistory = model<BetHistoryI>("BetHistory", betHistorySchema);

export default BetHistory;
