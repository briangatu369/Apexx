import { CorsOptions } from "cors";

const allowedOrigins: string[] = ["http://localhost:5173"];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed"), false);
    }
  },
  credentials: true,
};

export const socketIoConfig = {
  cors: { origin: allowedOrigins, credentials: true },
};
