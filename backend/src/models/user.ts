import mongoose, { Document } from "mongoose";
import { kenyaPhoneNumberRegex } from "../validations/auth";

export interface UserInterface extends Document {
  username: string;
  role: "user" | "admin";
  phoneNumber: string;
  balance: number;
  accountStatus: "active" | "locked" | "suspended";
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  generateAuthToken: () => any;
}

const userSchema = new mongoose.Schema<UserInterface>(
  {
    username: {
      type: String,
      unique: [true, "User name already in use."],
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phoneNumber: {
      type: String,
      unique: [true, "User with phone number already exist."],
      match: [kenyaPhoneNumberRegex, "Invalid phone Number"],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    accountStatus: {
      type: String,
      enum: ["active", "locked", "suspended"],
      default: "active",
    },
    password: { type: String, required: true },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
