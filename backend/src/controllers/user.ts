import { Request, Response } from "express";
import UserService from "../services/userServices";
import { loginSchema, registerSchema } from "../validations/auth";
import AuthError from "../utils/errors/authError";
import {
  clearCookies,
  createAuthenticationCookies,
} from "../utils/auth/cookies";
import { UserInterface } from "../models/user";
import { isSpecificError } from "../utils/errorTypeChecker";

const userServices = new UserService();

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
        throw new AuthError({ description: errorMessage, httpCode: 400 });
      }

      const { accessToken, refreshToken, user } = await userServices.createUser(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      const userData = this.mapUserToResponse(user);

      res
        .status(200)
        .json({ message: "Account created successfully.", userData });
    } catch (err) {
      console.error("Registration Error:", err);

      const isAuthError = isSpecificError(err, AuthError);
      const code = isAuthError ? err.httpCode : 500;

      res.status(code).json({ error: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        throw new AuthError({ description: errorMessage, httpCode: 400 });
      }

      const { accessToken, refreshToken, user } = await userServices.login(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      const userData = this.mapUserToResponse(user);

      res.status(200).json({ message: "logged in successfully", userData });
    } catch (err) {
      console.error("Login Error:", err);

      const isAuthError = isSpecificError(err, AuthError);
      const code = isAuthError ? err.httpCode : 500;

      res.status(code).json({ error: err.message });
    }
  };

  verifyUserAuthentication = async (req: Request, res: Response) => {
    try {
      const userInfo = req.user;

      const user = await userServices.verifyAuthentication(userInfo);
      const userData = this.mapUserToResponse(user);
      res.status(200).json({ message: "Authenticated", userData });
    } catch (err) {
      const isAuthError = isSpecificError(err, AuthError);
      const code = isAuthError ? err.httpCode : 500;

      res.status(code).json({ error: err.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    clearCookies(res);
    res.status(200).json({ message: "Loggedout successfully" });
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
