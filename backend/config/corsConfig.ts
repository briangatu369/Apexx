import { CorsOptions } from "cors";

const allowedOrigins: string[] = ["http://localhost:5173"];

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow: boolean) => void
  ) => {
    if (allowedOrigins.includes(origin || "") || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed"), false);
    }
  },
  credentials: true,
};

export const socketIoConfig = {
  cors: { origin: "http://localhost:5173", credentials: true },
};
