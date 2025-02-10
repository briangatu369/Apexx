import { Button } from "@/components/ui/button";
import { BetState } from "@/stores/useBetStore";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { MAXIMUM_STAKE, MINIMUM_STAKE } from "@/config/constants";

interface DefaultStakesProps {
  setStake: BetState["setStake"];
  areBetActionsDisabled: boolean;
  currentStake?: number;
}

const DEFAULT_STAKES = [MINIMUM_STAKE, 100, 200, MAXIMUM_STAKE] as const;
type DefaultStake = (typeof DEFAULT_STAKES)[number];

const DefaultStakes = ({
  setStake,
  areBetActionsDisabled,
  currentStake,
}: DefaultStakesProps) => {
  const handleStakeClick = useCallback(
    (stake: DefaultStake) => {
      setStake(stake);
    },
    [setStake]
  );

  return (
    <div
      className="grid grid-cols-2 gap-[2px]"
      role="group"
      aria-label="Default stake options"
    >
      {DEFAULT_STAKES.map((stake, index) => {
        const isSelected = currentStake === stake;

        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            disabled={areBetActionsDisabled}
            onClick={() => handleStakeClick(stake)}
            className={cn(
              "bg-accent-background text-light-white  rounded-full  p-0  h-fit py-[1px] px-2  font-medium border-none transition-all duration-200 hover:bg-accent-background hover:text-white/90"
            )}
            aria-pressed={isSelected}
          >
            {stake.toFixed(2)}
          </Button>
        );
      })}
    </div>
  );
};

export default DefaultStakes;
