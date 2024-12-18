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
    sameSite: "strict",
    secure: false,
  });

  res.cookie("refresh-token", refreshToken, {
    httpOnly: true,
    maxAge: maxAgeRefresh,
    sameSite: "strict",
    secure: false,
  });
};

export const clearCookies = (res: Response) => {
  res.clearCookie("access-token", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
  });

  res.clearCookie("refresh-token", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
  });
};
