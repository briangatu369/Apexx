import { GamePhase } from "@/stores/gameStore";

export const SOCKET_EVENT_NAMES = {
  listeners: {
    connect: "connect",
    disconnect: "disconnect",
    connectError: "connect_error",
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

  emitters: {
    placebet: "placebet",
    cashout: "cashout",
    requestInitialData: "requestInitialData",
  },
};
