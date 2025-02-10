import { Button } from "@/components/ui/button";
import useBetActions from "@/hooks/betting/useBetActions";

import useGameStore, { GamePhase } from "@/stores/gameStore";
import { BetState } from "@/stores/useBetStore";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import useBetSocket from "@/hooks/betting/useBetSocket";
import toast from "react-hot-toast";
import CashoutToaster, { showCashoutToast } from "@/components/CashoutToast";

interface BetButtonProps {
  betState: BetState;
  buttonId: number;
  isButtonDisabled: boolean;
}

interface ButtonState {
  message: React.ReactNode;
  className: string;
}

const BetButton = ({
  betState,
  buttonId,
  isButtonDisabled,
}: BetButtonProps) => {
  useBetSocket(betState, buttonId);
  const { perfomeBetAction } = useBetActions(betState, buttonId);

  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentMultiplier = useGameStore((state) => state.currentMultiplier);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} KSH`;
  };

  const buttonState = useMemo((): ButtonState => {
    // Waiting state during betting phase
    if (gamePhase === GamePhase.BETTING && betState.hasScheduledBet) {
      return {
        message: "Waiting",
        className: "bg-gray-500",
      };
    }

    // Bet accepted state
    if (
      (gamePhase === GamePhase.BETTING && betState.hasPlacedBet) ||
      (gamePhase === GamePhase.PREPARING && betState.hasPlacedBet)
    ) {
      return {
        message: (
          <div className="flex flex-col text-sm">
            <span>Bet</span>
            <span>Accepted</span>
          </div>
        ),
        className: "bg-custom-green",
      };
    }

    // Cash out state
    if (betState.hasPlacedBet) {
      const cashoutAmount = betState.stake * currentMultiplier;
      return {
        message: (
          <div className="flex flex-col justify-center">
            <span>CASH OUT</span>
            <span className="flex items-baseline justify-center gap-1 -mt-1.5">
              {formatCurrency(cashoutAmount)}
            </span>
          </div>
        ),
        className: "bg-custom-green",
      };
    }

    // Scheduled bet state
    if (betState.hasScheduledBet) {
      return {
        message: "Waiting",
        className: "bg-custom-red",
      };
    }

    // Default betting state
    return {
      message: (
        <div className="flex flex-col justify-center">
          <span>Bet</span>
          <span className="flex items-baseline justify-center gap-1 -mt-1.5">
            {formatCurrency(betState.stake)}
          </span>
        </div>
      ),
      className: "text-black bg-custom-yellow",
    };
  }, [gamePhase, betState, currentMultiplier]);

  return (
    <div className="h-full flex flex-col items-center gap-1">
      {betState.hasScheduledBet && (
        <p className="text-light-white">Waiting next Round</p>
      )}
      <Button
        className={cn(
          `h-full text-white/90 border rounded-xl   border-white/80
        capitalize tracking-wider font-semibold w-full
        text-lg text-center transition-colors duration-200
        shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`,
          buttonState.className
        )}
        disabled={isButtonDisabled}
        onClick={perfomeBetAction}
        aria-live="polite"
      >
        {buttonState.message}
      </Button>
    </div>
  );
};

export default BetButton;
