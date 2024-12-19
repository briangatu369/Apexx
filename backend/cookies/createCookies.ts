import { Response } from "express";

const maxAgeAccess = 60 * 1000 * 60 * 24;
//  maxAgeAccess,constant = 1000
const maxAgeRefresh = 60 * 1000 * 60 * 24 * 30;
//  maxAgeRefresh,constant = 1000

export const createAuthenticationCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("access-token", accessToken, {
    httpOnly: true,
    maxAge: maxAgeAccess,
    sameSite: "lax", // Changed to "lax"
    secure: process.env.NODE_ENV === "production", // Secure in production
  });

  res.cookie("refresh-token", refreshToken, {
    httpOnly: true,
    maxAge: maxAgeRefresh,
    sameSite: "lax", // Changed to "lax"
    secure: process.env.NODE_ENV === "production", // Secure in production
  });
};

export const clearCookies = (res: Response) => {
  res.clearCookie("access-token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.clearCookie("refresh-token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};
