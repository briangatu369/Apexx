import { Request, Response } from "express";
import UserService from "../services/userServices";
import { loginSchema, registerSchema } from "../validations/auth";
import AuthError from "../utils/errors/authError";
import {
  clearCookies,
  createAuthenticationCookies,
} from "../utils/auth/cookies";
import User, { UserInterface } from "../models/user";
const userProvider = new UserService();

interface UserResponse {
  phoneNumber: string;
  username: string;
  accountBalance: number;
  role: string;
  userId: string;
}

class UserController {
  constructor() {}

  createUser = async (req: Request, res: Response) => {
    try {
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        throw new AuthError({ description: errorMessage });
      }

      const { accessToken, refreshToken, user } = await userProvider.createUser(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      const userData = this.mapUserToResponse(user);

      res
        .status(200)
        .json({ message: "Account created successfully.", userData });
    } catch (err) {
      console.error("Registration Error:", err);
      const code = err.code >= 400 && err.code <= 599 ? err.code : 500;
      res.status(code).json({ error: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        throw new AuthError({ description: errorMessage });
      }

      const { accessToken, refreshToken, user } = await userProvider.login(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      const userData = this.mapUserToResponse(user);

      res.status(200).json({ message: "logged in successfully", userData });
    } catch (err) {
      console.error("Login Error:", err);

      const code = err.code >= 400 && err.code <= 599 ? err.code : 500;
      res.status(code).json({ error: err.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    clearCookies(res);
    res.status(200).json({ message: "Successfully logged out" });
  };

  private mapUserToResponse(user: UserInterface): UserResponse {
    return {
      phoneNumber: user.phoneNumber,
      username: user.username,
      accountBalance: user.balance,
      role: user.role,
      userId: user._id as string,
    };
  }
}

export default UserController;
