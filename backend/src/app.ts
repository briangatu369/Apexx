import { createServer, Server } from "http";
import { Server as SocketIoServer } from "socket.io";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { corsOptions, socketIoConfig } from "./config/corsConfig";
import GameManager from "./services/gameServices";
import connectDb from "./db/connectDb";
import SOCKET_EVENT_NAMES from "./config/socketEventNamesConfig";
import {
  BettingPayload,
  CashoutPayload,
} from "./validations/bettingRequestValidations";
import { UserRouter } from "./routes/user";

export const app = express();

dotenv.config();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/user-service", UserRouter);

const httpServer = createServer(app);
const io = new SocketIoServer(httpServer, socketIoConfig);

interface GameServerConfig {
  io: SocketIoServer;
  httpServer: Server;
  port: number | string;
  mongoUri: string;
}

class GameServer {
  private io: SocketIoServer;
  private httpServer: Server;
  private gameManager: GameManager;
  private port: number | string;
  private mongoUri: string;

  constructor(servers: GameServerConfig) {
    this.io = servers.io;
    this.httpServer = servers.httpServer;
    this.gameManager = new GameManager(this.io);
    this.port = servers.port;
    this.mongoUri = servers.mongoUri;
  }

  async startServer() {
    try {
      await connectDb(this.mongoUri);

      this.httpServer.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
        this.setupSocketConnections();
      });

      this.gameManager.startGameSession();
    } catch (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  }

  private setupSocketConnections() {
    this.io.on(SOCKET_EVENT_NAMES.listeners.connect, (socket) => {
      const initialData = this.gameManager.onConnectionData();
      socket.emit(SOCKET_EVENT_NAMES.emitters.initialData, initialData);

      socket.on(
        SOCKET_EVENT_NAMES.listeners.placebet,
        (payload: BettingPayload) =>
          this.gameManager.handlePlaceBet(socket, payload)
      );

      socket.on(
        SOCKET_EVENT_NAMES.listeners.cashout,
        (payload: CashoutPayload) =>
          this.gameManager.handleCashout(socket, payload)
      );

      socket.on(SOCKET_EVENT_NAMES.listeners.disconnect, () => {
        console.log("disconnected");
      });
    });
  }
}

export { httpServer, io, GameServer };
