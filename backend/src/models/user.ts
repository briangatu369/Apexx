import mongoose, { Document, Model, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { kenyaPhoneNumberRegex } from "../validations/auth";
import { maxAgeAccess, maxAgeRefresh } from "../utils/auth/cookies";
import AuthError from "../utils/errors/authError";

export interface UserInterface extends Document {
  username: string;
  profileImage: string;
  role: "user" | "admin";
  phoneNumber: string;
  balance: number;
  accountStatus: "active" | "locked" | "suspended";
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  generateAuthToken: () => any;
}

interface UserStaticMethods extends Model<UserInterface> {
  findByCred: (phoneNumber: string, password: string) => Promise<UserInterface>;
}

const userSchema = new mongoose.Schema<UserInterface>(
  {
    username: {
      type: String,
      unique: [true, "User name already in use."],
      required: true,
    },
    profileImage: { type: String, default: "" },
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

userSchema.statics.findByCred = async function (
  phoneNumber: string,
  password: string
) {
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new Error("User not found.");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AuthError({ description: "Wrong password" });
  }

  return user;
};

userSchema.methods.generateAuthToken = function () {
  const user = this?._doc;

  const jwtData = { phoneNumber: user.phoneNumber, username: user.username };

  const accessToken = jwt.sign(jwtData, "12345", { expiresIn: maxAgeAccess });
  const refreshToken = jwt.sign(jwtData, "54321", {
    expiresIn: maxAgeRefresh,
  });

  return { accessToken, refreshToken };
};

const User = model<UserInterface, UserStaticMethods>("User", userSchema);

export default User;
