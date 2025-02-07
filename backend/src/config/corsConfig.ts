import { CorsOptions } from "cors";
import { ServerOptions } from "socket.io";

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

export const socketIoConfig: Partial<ServerOptions> = {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
};
