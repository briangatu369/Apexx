import { create } from "zustand";

interface Bet {
  userId: string;
  sessionId: string;
  username: string;
  stake: number;
  cashoutMultiplier: number | null;
  payout: number | null;
  betId: string;
}

export enum GamePhase {
  PREPARING = "PREPARING", //actions--nothing(game is starting)
  BETTING = "BETTING", // actions--placebet
  RUNNING = "RUNNING", // actions--scheduleBet,cashout
  CRASHED = "CRASHED", // actions--reset
  MAINTENANCE = "MAINTENANCE",
  ERROR = "ERROR",
}

export interface PreviousMultiplier {
  finalMultiplier: number;
  sessionId: string;
}

interface gameI {
  currentMultiplier: number;
  finalMultiplier: number | null;
  hashedServerSeed: string;
  gamePhase: GamePhase;
  bets: Bet[];
  previousMultipliers: PreviousMultiplier[];
  nextGameCountDown: number | null;

  updateCurrentMultiplier: (updatedMultiplier: number) => void;
  updateHashedServerSeed: (updatedSeed: string) => void;
  updateGamePhase: (updatedGamePhase: GamePhase) => void;
  updateBets: (updatedPlayers: Bet[]) => void;
  updateNextGameCountDown: (newCountDown: number | null) => void;
  updateFinalMultiplier: (newFinalMultiplier: number | null) => void;
  updatePreviousMultipliers: (newMultiplier: PreviousMultiplier) => void;
  updateMany: (obj: Partial<gameI>) => void;
}

const useGameStore = create<gameI>((set, get) => ({
  currentMultiplier: 1,
  finalMultiplier: null,
  hashedServerSeed: "",
  gamePhase: GamePhase.PREPARING,
  bets: [],
  previousMultipliers: [],
  nextGameCountDown: null,

  updateCurrentMultiplier: (updatedMultiplier: number) =>
    set({ currentMultiplier: updatedMultiplier }),
  updateHashedServerSeed: (updatedSeed: string) =>
    set({ hashedServerSeed: updatedSeed }),

  updateGamePhase: (updatedGamePhase: GamePhase) =>
    set({ gamePhase: updatedGamePhase }),
  updateBets: (updatedBets: Bet[]) => set({ bets: updatedBets }),

  updatePreviousMultipliers: (newMultiplier: PreviousMultiplier) => {
    const { previousMultipliers } = get();

    if (previousMultipliers.length > 50) {
      previousMultipliers.pop();
    }

    previousMultipliers.unshift(newMultiplier);

    set(() => ({
      previousMultipliers,
    }));
  },

  updateNextGameCountDown: (newCountDown: number | null) =>
    set({ nextGameCountDown: newCountDown }),
  updateFinalMultiplier: (newFinalMultiplier: number | null) =>
    set({ finalMultiplier: newFinalMultiplier }),

  updateMany: (obj: Partial<gameI>) => set((state) => ({ ...state, ...obj })),
}));

export default useGameStore;
