import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface UserPayload {
  phoneNumber: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const validateJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies["access-token"];

    if (!accessToken) {
      res.status(401).json({ message: "No access token provided" });
      return;
    }

    const decoded = jwt.verify(accessToken, "12345") as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT VALIDATION ERROR:", err);

    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export default validateJwt;
