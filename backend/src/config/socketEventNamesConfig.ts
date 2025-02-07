import { GamePhase } from "../models/game/gameSessionAnalytics";

const SOCKET_EVENT_NAMES = {
  listeners: {
    placebet: "placebet",
    cashout: "cashout",
    connect: "connection",
    disconnect: "disconnect",
  },
  emitters: {
    initialData: "InitialData",

    game: {
      broadcastHashedServerseed: "broadcastHashedServerSeed",
      broadcastCurrentMultiplier: "broadcastCurrentMultiplier",
      broadcastPlayers: "broadcastPlayers",
      nextGameCountDown: "nextGameCountDown",
      gamePhases: {
        crashed: GamePhase.CRASHED,
        running: GamePhase.RUNNING,
        betting: GamePhase.BETTING,
        preparing: GamePhase.PREPARING,
      },
      betting: {
        placebet: "placebet",
        placebetSuccess: "placebetSuccess",
        placebetError: "placebetError",
        cashout: "cashout",
        cashoutSuccess: "cashoutSuccess",
        cashoutError: "cashoutError",
      },
    },
  },
};

export default SOCKET_EVENT_NAMES;
