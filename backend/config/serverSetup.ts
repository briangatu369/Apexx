import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions, socketIoConfig } from "./corsConfig";
import userRouter from "../router/user";
import dotenv from "dotenv";

export const app = express();

dotenv.config();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/user-service", userRouter);

export const httpServer = createServer(app);
export const io = new Server(httpServer, socketIoConfig);
