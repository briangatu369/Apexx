import { SOCKET_EVENT_NAMES } from "@/config/socketEvent";
import socket from "@/config/socketIoConfig";
import useAuthStore from "@/stores/authStore";
import { BetState, BettingPayload } from "@/stores/useBetStore";
import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import useGameStore, { GamePhase } from "@/stores/gameStore";
import { toast } from "@/components/Toaster";

const useBetActions = (betState: BetState, buttonId: number) => {
  const { getValidBetActions, setHasScheduledBet, stake } = betState;
  const { isAuthenticated, userData } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      userData: state.userData,
    }))
  );
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentMultiplier = useGameStore((state) => state.currentMultiplier);
  const validBetActions = getValidBetActions(gamePhase);

  const placebet = async () => {
    if (!isAuthenticated || !userData?.userId) {
      betState.resetBetState();
      toast.error("Login to placebet");
      return;
    }

    betState.setIsRequesting(true);
    betState.setHasScheduledBet(false);

    const bettingPayload: BettingPayload = {
      stake,
      userId: userData.userId,
      buttonId,
    };
    socket.emit(SOCKET_EVENT_NAMES.emitters.placebet, bettingPayload);
  };

  const cashout = () => {
    betState.setIsRequesting(true);
    const cashoutPayload = { betId: betState.betId, buttonId };
    socket.emit(SOCKET_EVENT_NAMES.emitters.cashout, cashoutPayload);
  };

  const perfomeBetAction = useCallback(() => {
    if (validBetActions.canPlacebet) {
      placebet();
    } else if (validBetActions.canCashout) {
      cashout();
    } else if (validBetActions.canScheduleBet) {
      if (!isAuthenticated || !userData?.userId) {
        toast.error("login to placebet");
        return;
      }
      setHasScheduledBet(true);
    } else if (validBetActions.canUnscheduleBet) {
      setHasScheduledBet(false);
    } else {
      console.warn("No valid bet action available");
    }
  }, [
    validBetActions,
    placebet,
    cashout,
    setHasScheduledBet,
    isAuthenticated,
    userData,
  ]);

  useEffect(() => {
    // Reset bet state if the game crashed
    if (gamePhase === GamePhase.CRASHED && betState.hasPlacedBet) {
      betState.resetBetState();
    }

    // Place bet if in BETTING phase and a bet is scheduled
    if (gamePhase === GamePhase.BETTING && betState.hasScheduledBet) {
      placebet();
    }

    //auto bet
    if (validBetActions.canAutoBet) {
      placebet();
    }

    //auto cashout
    if (validBetActions.canAutoCashout) {
      if (+currentMultiplier.toFixed(2) >= betState.autoCashoutAt) {
        betState.setAutoCashoutHasBeenInitialzed(true);
        cashout();
      }
    }
  }, [gamePhase, currentMultiplier, betState.hasAutoBet]);

  return { placebet, cashout, perfomeBetAction };
};

export default useBetActions;
