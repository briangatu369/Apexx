import { BetState } from "@/stores/useBetStore";
import { useCallback, useEffect } from "react";
import { SocketEvent } from "../useConnectSocketIo";
import { SOCKET_EVENT_NAMES } from "@/config/socketEvent";
import socket from "@/config/socketIoConfig";
import useAuthStore from "@/stores/authStore";
import { showCashoutToast } from "@/components/CashoutToast";
import { toast } from "@/components/Toaster";

interface BetSuccessResponse {
  betId: string;
  accountBalance: number;
}
interface BetErrorResponse {
  errorMessage: string;
}
interface CashoutSuccessResponse {
  payout: number;
  cashoutMultiplier: number;
  accountBalance: number;
}
interface CashoutErrorResponse {
  errorMessage: string;
}

const useBetSocket = (betState: BetState, buttonId: number) => {
  const { onPlacebetSuccess, onPlacebetFailure, onCashoutSuccessOrFailure } =
    betState;
  const updateUserData = useAuthStore((state) => state.updateUserData);

  //event handlers
  const handlePlacebetError = useCallback(
    (data: BetErrorResponse) => {
      onPlacebetFailure();
      toast.error(data.errorMessage || "Failed to place bet");
    },
    [onPlacebetFailure]
  );

  const handlePlacebetSuccess = useCallback(
    (data: BetSuccessResponse) => {
      onPlacebetSuccess(data.betId);
      updateUserData({ accountBalance: data.accountBalance });
    },
    [onPlacebetSuccess]
  );

  const handleCashoutError = useCallback(
    (data: CashoutErrorResponse) => {
      onCashoutSuccessOrFailure();
      toast.error(data.errorMessage || "Failed to cashout");
    },
    [onCashoutSuccessOrFailure]
  );

  const handleCashoutSuccess = useCallback(
    (data: CashoutSuccessResponse) => {
      onCashoutSuccessOrFailure();
      updateUserData({ accountBalance: data.accountBalance });

      showCashoutToast({
        cashoutMultiplier: data.cashoutMultiplier,
        payout: data.payout,
      });
    },
    [onCashoutSuccessOrFailure]
  );

  useEffect(() => {
    //setup events
    const socketEvents: SocketEvent[] = [
      {
        eventName: `${SOCKET_EVENT_NAMES.listeners.game.betting.placebetError}${buttonId}`,
        handler: handlePlacebetError,
      },
      {
        eventName: `${SOCKET_EVENT_NAMES.listeners.game.betting.placebetSuccess}${buttonId}`,
        handler: handlePlacebetSuccess,
      },
      {
        eventName: `${SOCKET_EVENT_NAMES.listeners.game.betting.cashoutError}${buttonId}`,
        handler: handleCashoutError,
      },
      {
        eventName: `${SOCKET_EVENT_NAMES.listeners.game.betting.cashoutSuccess}${buttonId}`,
        handler: handleCashoutSuccess,
      },
    ];

    //listen to events
    socketEvents.forEach(({ eventName, handler }) => {
      socket.on(eventName, handler);
    });

    return () => {
      //clear all events
      socketEvents.forEach(({ eventName, handler }) => {
        socket.off(eventName, handler);
      });
    };
  }, [onPlacebetSuccess, onPlacebetFailure, onCashoutSuccessOrFailure]);
};

export default useBetSocket;
