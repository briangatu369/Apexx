import { Request, Response } from "express";
import Joi from "joi";
import UserService from "../services/userServices";
import { createAuthenticationCookies } from "../cookies/createCookies";
import { kenyaPhoneNumberRegex } from "../models/user";

const userProvider = new UserService();

const registerSchema = Joi.object({
  username: Joi.string().required().min(4).max(10),
  phoneNumber: Joi.string().pattern(kenyaPhoneNumberRegex).required(),
  password: Joi.string().min(4).required(),
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(kenyaPhoneNumberRegex).required(),
  password: Joi.string().required(),
});

class UserController {
  constructor() {}

  createUser = async (req: Request, res: Response) => {
    try {
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        res.status(400).json({ error: errorMessage });
      }

      const { accessToken, refreshToken } = await userProvider.createUser(
        value
      );

      createAuthenticationCookies(res, accessToken, refreshToken);

      res.json({ accessToken, refreshToken });
    } catch (error) {}
  };

  login = async (req: Request, res: Response) => {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        const errorMessage = error.details[0]?.message;
        res.status(400).json({ error: errorMessage });
      }

      const { accessToken, refreshToken } = await userProvider.login(value);

      createAuthenticationCookies(res, accessToken, refreshToken);

      res.json({ accessToken, refreshToken });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  };
}

export default UserController;
