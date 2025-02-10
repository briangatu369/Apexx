import { SOCKET_EVENT_NAMES } from "@/config/socketEvent";
import socket from "@/config/socketIoConfig";
import useGameStore, {
  GamePhase,
  PreviousMultiplier,
} from "@/stores/gameStore";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

export interface SocketEvent {
  eventName: string;
  handler: (data: any) => void;
}

const useConnectSocketIo = () => {
  const [isSocketConnecting, setIsSocketConnecting] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketFailedToConnect, setSocketFailedToConnect] = useState(false);

  const {
    updateHashedServerSeed,
    updateGamePhase,
    updatePreviousMultipliers,
    updateMany,
  } = useGameStore(
    useShallow((state) => ({
      updateHashedServerSeed: state.updateHashedServerSeed,
      updateGamePhase: state.updateGamePhase,
      updatePreviousMultipliers: state.updatePreviousMultipliers,
      updateMany: state.updateMany,
    }))
  );

  //event handlers
  const handleSuccessfulSocketConnection = () => {
    setIsSocketConnecting(false);
    setSocketFailedToConnect(false);
    setIsSocketConnected(true);
  };

  const handleFailedSocketConnection = () => {
    setIsSocketConnected(false);
    setIsSocketConnecting(false);
    setSocketFailedToConnect(true);
  };

  const handleInitialData = (data: any) => {
    updateMany({ previousMultipliers: data.previousMultipliers });
  };

  const handleHashedServerSeed = (data: { hashedServerSeed: string }) => {
    updateHashedServerSeed(data.hashedServerSeed);
  };

  const handleCurrentMultiplier = (data: {
    currentMultiplier: number;
    hashedServerSeed: string;
    gamePhase: GamePhase;
  }) => {
    updateMany({
      gamePhase: data.gamePhase,
      currentMultiplier: data.currentMultiplier,
      hashedServerSeed: data.hashedServerSeed,
    });
  };

  const handleGamePhaseUpdate = (data: { gamePhase: GamePhase }) => {
    updateGamePhase(data.gamePhase);
  };

  const handleNextGameCountDown = (data: {
    gamePhase: GamePhase;
    timeToNextSession: number;
  }) => {
    updateMany({
      gamePhase: data.gamePhase,
      nextGameCountDown: data.timeToNextSession,
    });
  };

  const handleGameCrashed = (data: {
    gamePhase: GamePhase;
    previousMultiplier: PreviousMultiplier;
  }) => {
    updateMany({
      currentMultiplier: 1,
      gamePhase: data.gamePhase,
      finalMultiplier: data.previousMultiplier.finalMultiplier,
    });
    updatePreviousMultipliers({
      finalMultiplier: data.previousMultiplier.finalMultiplier,
      sessionId: data.previousMultiplier.sessionId,
    });
  };

  const socketIoListeners: SocketEvent[] = [
    {
      eventName: SOCKET_EVENT_NAMES.listeners.connectError,
      handler: handleFailedSocketConnection,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.connect,
      handler: handleSuccessfulSocketConnection,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.initialData,
      handler: handleInitialData,
    },

    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.broadcastHashedServerseed,
      handler: handleHashedServerSeed,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.broadcastCurrentMultiplier,
      handler: handleCurrentMultiplier,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.gamePhases.preparing,
      handler: handleGamePhaseUpdate,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.gamePhases.running,
      handler: handleGamePhaseUpdate,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.gamePhases.crashed,
      handler: handleGameCrashed,
    },
    {
      eventName: SOCKET_EVENT_NAMES.listeners.game.nextGameCountDown,
      handler: handleNextGameCountDown,
    },
  ];

  useEffect(() => {
    setIsSocketConnecting(true);

    socket.connect();

    socketIoListeners.forEach((listener) => {
      socket.on(listener.eventName, listener.handler);
    });

    return () => {
      socketIoListeners.forEach((listener) => {
        socket.off(listener.eventName, listener.handler);
      });

      socket.disconnect();
      setIsSocketConnected(false);
    };
  }, []);

  return { isSocketConnected, isSocketConnecting, socketFailedToConnect };
};

export default useConnectSocketIo;
