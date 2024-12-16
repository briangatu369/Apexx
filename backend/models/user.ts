import mongoose, { Document } from "mongoose";

const kenyaPhoneNumberRegex = /^(07|01)\d{8}$/;

interface UserInterface extends Document {
  username: string;
  profileImage?: string;
  role: "user" | "admin";
  phoneNumber: string;
  balance: number;
  accountStatus: "active" | "locked" | "suspended";
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<UserInterface>(
  {
    username: { type: String, unique: true, required: true },
    profileImage: { type: String },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phoneNumber: {
      type: String,
      unique: true,
      match: [kenyaPhoneNumberRegex, "Invalid phone Number"],
      required: true,
    },
    balance: { type: Number, default: 0 },
    accountStatus: {
      type: String,
      enum: ["active", "locked", "suspended"],
      default: "active",
    },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<UserInterface>("User", userSchema);

export default User;
