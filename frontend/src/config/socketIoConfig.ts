import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1500,
});

export default socket;
