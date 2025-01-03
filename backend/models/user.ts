import mongoose, { Document, Model, model } from "mongoose";
import jwt from "jsonwebtoken";
import bycrpt from "bcryptjs";
import { kenyaPhoneNumberRegex } from "../validation/authValidation";
import NotFoundError from "../utils/errors/notFoundError";

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

  generateAuthToken: () => any;
}

interface UserStaticMethods extends Model<UserInterface> {
  findByCred: (phoneNumber: string, password: string) => Promise<UserInterface>;
}

const userSchema = new mongoose.Schema(
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
    balance: { type: Number, default: 0 },
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
    throw new NotFoundError("User not found.");
  }

  const isMatch = await bycrpt.compare(password, user.password);

  if (!isMatch) {
    throw new NotFoundError("Wrong Password.");
  }

  return user;
};

userSchema.methods.generateAuthToken = function () {
  const { password, ...rest } = this;

  const accessToken = jwt.sign(rest, "12345");
  const refreshToken = jwt.sign(rest, "aljsdflajfl;sdj");

  return { accessToken, refreshToken };
};

const User = model<UserInterface, UserStaticMethods>("User", userSchema);

export default User;
