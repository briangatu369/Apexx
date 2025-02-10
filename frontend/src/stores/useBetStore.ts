import {
  DEFAULT_AUTO_CASHOUT_VALUE,
  MINIMUM_AUTO_CASHOUT_VALUE,
  MINIMUM_STAKE,
} from "@/config/constants";
import { create } from "zustand";
import { GamePhase } from "./gameStore";

// Types
export interface BetActions {
  canPlacebet: boolean;
  canScheduleBet: boolean;
  canUnscheduleBet: boolean;
  canCashout: boolean;
  canAutoBet: boolean;
  canAutoCashout: boolean;
}

export interface BettingPayload {
  userId: string;
  stake: number;
  buttonId: number;
}

export interface CashoutPayload {
  betId: string;
}

export interface BetState {
  readonly stake: number;
  readonly hasScheduledBet: boolean;
  readonly hasPlacedBet: boolean;
  readonly hasCashedout: boolean;
  readonly isRequesting: boolean;
  readonly betId: string | null;
  readonly autoCashoutAt: number;
  readonly hasAutoBet: boolean;
  readonly hasAutoCashout: boolean;
  readonly autoCashoutHasBeenInitialzed: boolean;

  // Actions
  setStake: (amount: number) => void;
  setHasScheduledBet: (status: boolean) => void;
  setHasPlacedBet: (status: boolean) => void;
  setHasCashedout: (status: boolean) => void;
  setIsRequesting: (status: boolean) => void;
  setAutoCashoutAt: (multiplier: number) => void;
  setAutoCashoutHasBeenInitialzed: (isInitialized: boolean) => void;
  toggleAutoBet: () => void;
  toggleAutoCashout: () => void;
  onPlacebetSuccess: (betId: string) => void;
  onPlacebetFailure: () => void;
  onCashoutSuccessOrFailure: () => void;
  resetBetState: () => void;
  areActionsDisabled: (gamePhase: GamePhase) => ActionDisabledState;
  getValidBetActions: (currentPhase: GamePhase) => BetActions;
}

interface ActionDisabledState {
  isButtonDisabled: boolean;
  areOtherActionsDisabled: boolean;
}

interface ActionDisabledStateParams {
  gamePhase: GamePhase;
  isRequesting: boolean;
  hasPlacedBet: boolean;
  hasScheduledBet: boolean;
}

const createInitialState = () =>
  Object.freeze({
    stake: MINIMUM_STAKE,
    betId: null,
    isRequesting: false,
    autoCashoutAt: DEFAULT_AUTO_CASHOUT_VALUE,
    autoCashoutHasBeenInitialzed: false,
    hasScheduledBet: false,
    hasPlacedBet: false,
    hasCashedout: false,
    hasAutoBet: false,
    hasAutoCashout: false,
  });

// Helper functions
const calculateActionDisabledState = ({
  gamePhase,
  isRequesting,
  hasPlacedBet,
  hasScheduledBet,
}: ActionDisabledStateParams): ActionDisabledState => {
  const isButtonDisabled =
    gamePhase === GamePhase.PREPARING ||
    isRequesting ||
    (gamePhase === GamePhase.BETTING && hasPlacedBet);

  const areOtherActionsDisabled =
    gamePhase === GamePhase.PREPARING ||
    isRequesting ||
    hasScheduledBet ||
    (gamePhase === GamePhase.BETTING && hasPlacedBet) ||
    (gamePhase === GamePhase.RUNNING && hasPlacedBet);

  return { isButtonDisabled, areOtherActionsDisabled };
};

const calculateValidBetActions = (
  gamePhase: GamePhase,
  state: BetState
): BetActions => {
  if (state.isRequesting) {
    return {
      canPlacebet: false,
      canCashout: false,
      canScheduleBet: false,
      canUnscheduleBet: false,
      canAutoBet: false,
      canAutoCashout: false,
    };
  }

  const actions: BetActions = {
    canPlacebet: gamePhase === GamePhase.BETTING,
    canCashout: gamePhase === GamePhase.RUNNING && state.hasPlacedBet,
    canScheduleBet:
      (gamePhase === GamePhase.RUNNING || gamePhase === GamePhase.CRASHED) &&
      !state.hasPlacedBet &&
      !state.hasScheduledBet,
    canUnscheduleBet: state.hasScheduledBet,
    canAutoBet:
      gamePhase === GamePhase.BETTING &&
      state.hasAutoBet &&
      !state.hasScheduledBet,
    canAutoCashout:
      gamePhase === GamePhase.RUNNING &&
      state.hasAutoCashout &&
      state.hasPlacedBet &&
      !state.autoCashoutHasBeenInitialzed,
  };

  return actions;
};

// Create the store
const createBetStore = () => {
  return create<BetState>((set, get) => ({
    ...createInitialState(),

    setStake: (amount) => {
      if (typeof amount !== "number" || isNaN(amount)) {
        return;
      }
      set({ stake: Math.max(MINIMUM_STAKE, amount) });
    },

    setHasScheduledBet: (status) => set({ hasScheduledBet: status }),

    setHasPlacedBet: (status) => set({ hasPlacedBet: status }),
    setHasCashedout: (status) => set({ hasCashedout: status }),

    setIsRequesting: (status) => set({ isRequesting: status }),

    setAutoCashoutAt: (autoCashoutMultiplier) =>
      set({
        autoCashoutAt: Math.max(
          autoCashoutMultiplier,
          MINIMUM_AUTO_CASHOUT_VALUE
        ),
      }),

    setAutoCashoutHasBeenInitialzed: (isInitalized) =>
      set({ autoCashoutHasBeenInitialzed: isInitalized }),

    toggleAutoBet: () => set((state) => ({ hasAutoBet: !state.hasAutoBet })),

    toggleAutoCashout: () =>
      set((state) => ({ hasAutoCashout: !state.hasAutoCashout })),

    onPlacebetSuccess: (betId) =>
      set({
        betId,
        hasPlacedBet: true,
        hasScheduledBet: false,
        isRequesting: false,
      }),

    onPlacebetFailure: () =>
      set({
        hasScheduledBet: false,
        isRequesting: false,
      }),

    onCashoutSuccessOrFailure: () =>
      set({
        autoCashoutHasBeenInitialzed: false,
        hasPlacedBet: false,
        isRequesting: false,
        betId: null,
      }),

    resetBetState: () =>
      set(() => ({
        autoCashoutHasBeenInitialzed: false,
        hasPlacedBet: false,
        hasScheduledBet: false,
        isRequesting: false,
      })),

    areActionsDisabled: (gamePhase) => {
      const { isRequesting, hasPlacedBet, hasScheduledBet } = get();
      return calculateActionDisabledState({
        gamePhase,
        isRequesting,
        hasPlacedBet,
        hasScheduledBet,
      });
    },

    getValidBetActions: (gamePhase) => {
      const state = get();
      return calculateValidBetActions(gamePhase, state);
    },
  }));
};

export default createBetStore;
