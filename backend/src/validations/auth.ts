import Joi from "joi";

export const kenyaPhoneNumberRegex = /^(07|01)\d{8}$/;

export const registerSchema = Joi.object({
  username: Joi.string().required().min(4).max(10).messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username cannot be empty.",
    "string.min": "Username must be at least 4 characters long.",
    "string.max": "Username must be at most 10 characters long.",
    "any.required": "Username is required.",
  }),

  phoneNumber: Joi.string().pattern(kenyaPhoneNumberRegex).required().messages({
    "string.base": "Phone number must be a string.",
    "string.empty": "Phone number cannot be empty.",
    "string.pattern.base": "Invalid phone number.",
    "any.required": "Phone number is required.",
  }),

  password: Joi.string().min(4).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least 4 characters long.",
    "any.required": "Password is required.",
  }),
});

export const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(kenyaPhoneNumberRegex).required().messages({
    "string.base": "Phone number must be a string.",
    "string.empty": "Phone number cannot be empty.",
    "string.pattern.base": "Invalid phone number.",
    "any.required": "Phone number is required.",
  }),

  password: Joi.string().required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password cannot be empty.",
    "any.required": "Password is required.",
  }),
});
