import { Request, Response } from "express";
import UserService from "../services/userServices";
import {
  clearCookies,
  createAuthenticationCookies,
} from "../cookies/createCookies";
import { loginSchema, registerSchema } from "../validation/authValidation";
import InvalidDataError from "../utils/errors/invalidDataError";

const userProvider = new UserService();

class UserController {
  constructor() {}

  createUser = async (req: Request, res: Response) => {
    try {
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        throw new InvalidDataError(errorMessage);
      }

      const { accessToken, refreshToken } = await userProvider.createUser(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      res.status(200).json({ message: "Account created successfully." });
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
        throw new InvalidDataError(errorMessage);
      }

      const { accessToken, refreshToken } = await userProvider.login(value);

      createAuthenticationCookies(res, accessToken, refreshToken);

      res.status(200).json({ message: "logged in successfully" });
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
}

export default UserController;
