import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { corsOptions, socketIoConfig } from "./config/corsConfig";

export const app = express();

dotenv.config();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

export const httpServer = createServer(app);
export const io = new Server(httpServer, socketIoConfig);
