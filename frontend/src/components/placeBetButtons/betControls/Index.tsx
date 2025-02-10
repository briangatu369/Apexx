import { useMemo } from "react";
import useGameStore from "@/stores/gameStore";
import independentBetStore from "@/stores/useBetStore";
import Autos from "./Autos";
import BetButton from "./BetButton";
import DefaultStakes from "./DefaultStakes";
import StakeInput from "./StakeInput";

interface BetControlProps {
  buttonId: number;
}

const BetControl = ({ buttonId }: BetControlProps) => {
  const useBetStore = useMemo(() => independentBetStore(), []);
  const betState = useBetStore();
  const gamePhase = useGameStore((state) => state.gamePhase);
  const { isButtonDisabled, areOtherActionsDisabled: areBetActionsDisabled } =
    betState.areActionsDisabled(gamePhase);

  return (
    <div className="bg-[#18181a] flex flex-col gap-1 rounded-2xl max-w-[374px]  ">
      {/* Stake Controls Section */}
      <div className="flex items-center justify-center gap-1 px-6 py-1">
        <div className="flex-[2] flex flex-col gap-1">
          <StakeInput
            stake={betState.stake}
            setStake={betState.setStake}
            areBetActionsDisabled={areBetActionsDisabled}
          />
          <DefaultStakes
            setStake={betState.setStake}
            areBetActionsDisabled={areBetActionsDisabled}
            currentStake={betState.stake}
          />
        </div>

        {/* Bet Button Section */}
        <div className="flex-[3]">
          <BetButton
            betState={betState}
            isButtonDisabled={isButtonDisabled}
            buttonId={buttonId}
          />
        </div>
      </div>

      {/* Autos Section */}
      <div className="border-t-[1px] border-white/10 px-6 py-2">
        <Autos
          betState={betState}
          areBetActionsDisabled={areBetActionsDisabled}
        />
      </div>
    </div>
  );
};

export default BetControl;
