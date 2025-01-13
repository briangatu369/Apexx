import Joi from "joi";
import { GAME_CONFIG } from "../config/gameConfig";

export const betValidationSchema = Joi.object({
  stake: Joi.number()
    .greater(GAME_CONFIG.MIN_BET_AMOUNT - 1)
    .max(GAME_CONFIG.MAX_BET_AMOUNT)
    .required()
    .messages({
      "number.base": "Stake must be a number",
      "number.greater": `Minimum bet amount is ${GAME_CONFIG.MIN_BET_AMOUNT}`,
      "number.max": `Maximum bet amount is ${GAME_CONFIG.MAX_BET_AMOUNT}`,
      "any.required": "Stake is required",
    }),
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string",
    "any.required": "User ID is required",
  }),
});
