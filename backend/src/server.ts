import { GameServer, httpServer, io } from "./app";

const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URL || "mongodb://localhost:27017/apexx";

const server = new GameServer({
  io: io,
  httpServer: httpServer,
  port: PORT,
  mongoUri: MONGODB_URI,
});

server.startServer();
