import Joi from "joi";
import GAME_CONFIG from "../config/gameConfig";
import { BettingError } from "../utils/errors/bettingError";
import { CashoutError } from "../utils/errors/cashoutError";

export interface BettingPayload {
  userId: string;
  stake: number;
  buttonId: string;
}

export interface CashoutPayload {
  betId: string;
  buttonId: number;
}

const betValidationSchema = Joi.object<BettingPayload>({
  stake: Joi.number()
    .greater(GAME_CONFIG.MIN_STAKE - 1)
    .max(GAME_CONFIG.MAX_STAKE)
    .precision(2)
    .required()
    .messages({
      "number.base": "Stake must be a number",
      "number.greater": `Minimum bet amount is ${GAME_CONFIG.MIN_STAKE}`,
      "number.max": `Maximum bet amount is ${GAME_CONFIG.MAX_STAKE}`,
      "number.precision": "Stake must have at most 2 decimal places",
      "any.required": "Stake is required",
    }),
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string",
    "any.required": "User ID is required",
  }),
  buttonId: Joi.number().required().messages({
    "string.base": "Button Id must be a number",
    "any.required": "Button Id is required",
  }),
});

const validateBetPayload = (bet: BettingPayload) => {
  const { error } = betValidationSchema.validate(bet);

  if (error) {
    const errorMessage = !error._original.userId
      ? "An error occurred during betting"
      : error.message;

    throw new BettingError({
      description: errorMessage,
      internalDetails: error.message,
    });
  }
};

const cashoutValidationSchema = Joi.object<CashoutPayload>({
  betId: Joi.string().required().messages({
    "string.base": "Bet ID must be a string",
    "any.required": "Bet ID is required",
  }),
  buttonId: Joi.number().required().messages({
    "number.base": "Button Id  must be a number",
    "any.required": "Button Id is required",
  }),
});

const validateCashoutPayload = (cashout: CashoutPayload) => {
  const { error } = cashoutValidationSchema.validate(cashout);

  if (error) {
    throw new CashoutError({
      internalDetails: error.message,
    });
  }
};

export { validateBetPayload, validateCashoutPayload };
