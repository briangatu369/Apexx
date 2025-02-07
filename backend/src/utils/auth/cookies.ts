import { Response } from "express";

export const maxAgeAccess = 60 * 1000 * 60 * 24;
//  maxAgeAccess,constant = 1000
export const maxAgeRefresh = 60 * 1000 * 60 * 24 * 30;
//  maxAgeRefresh,constant = 1000

export const createAuthenticationCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("access-token", accessToken, {
    httpOnly: true,
    maxAge: maxAgeAccess,
    sameSite: "lax",
  });

  res.cookie("refresh-token", refreshToken, {
    httpOnly: true,
    maxAge: maxAgeRefresh,
    sameSite: "lax",
  });
};

export const clearCookies = (res: Response) => {
  res.clearCookie("access-token", {
    httpOnly: true,
    sameSite: "strict",
  });

  res.clearCookie("refresh-token", {
    httpOnly: true,
    sameSite: "strict",
  });
};
