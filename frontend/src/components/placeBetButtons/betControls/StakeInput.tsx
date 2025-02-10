import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAXIMUM_STAKE, MINIMUM_STAKE } from "@/config/constants";
import { BetState } from "@/stores/useBetStore";
import { ChangeEvent, useState, KeyboardEvent, useEffect } from "react";
import { IoAdd, IoRemove } from "react-icons/io5";

interface StakeInputProps {
  stake: number;
  setStake: BetState["setStake"];
  areBetActionsDisabled: boolean;
}

const StakeInput = ({
  stake,
  setStake,
  areBetActionsDisabled,
}: StakeInputProps) => {
  const [inputValue, setInputValue] = useState(stake.toFixed(2));

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow numbers and a single decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setInputValue(value);
  };

  const handleIncrement = () => {
    const newValue = Math.min(stake + 1, MAXIMUM_STAKE);
    setStake(newValue);
    setInputValue(newValue.toFixed(2));
  };

  const handleDecrement = () => {
    const newValue = Math.max(stake - 1, MINIMUM_STAKE);
    setStake(newValue);
    setInputValue(newValue.toFixed(2));
  };

  const handleBlur = () => {
    if (inputValue === "" || inputValue === ".") {
      setInputValue(MAXIMUM_STAKE.toFixed(2));
      setStake(MAXIMUM_STAKE);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      let finalValue;
      if (numValue > MAXIMUM_STAKE) {
        finalValue = MAXIMUM_STAKE;
      } else if (numValue < MINIMUM_STAKE) {
        finalValue = MINIMUM_STAKE;
      } else {
        finalValue = numValue;
      }

      const formattedValue = finalValue.toFixed(2);
      setInputValue(formattedValue);
      setStake(finalValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    }
  };

  // sync inputValue when stake updates
  useEffect(() => {
    setInputValue(stake.toFixed(2));
  }, [stake]);

  return (
    <div className="w-full bg-main-background rounded-full flex items-center justify-between px-2 py-[6px] gap-1">
      <Button
        onClick={handleDecrement}
        disabled={stake <= MINIMUM_STAKE || areBetActionsDisabled}
        className="rounded-full text-white bg-main-background border-[1.5px] border-white/50 p-2 h-3 w-3 flex justify-center items-center"
      >
        <span>
          <IoRemove />
        </span>
      </Button>
      <Input
        disabled={areBetActionsDisabled}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-fit p-0   border-none font-bold items-center  text-center"
      />
      <Button
        onClick={handleIncrement}
        disabled={stake >= MAXIMUM_STAKE || areBetActionsDisabled}
        className="rounded-full text-white bg-main-background border-[1.5px] border-white/50 p-2 h-3 w-3 flex justify-center items-center"
      >
        <span>
          <IoAdd />
        </span>
      </Button>
    </div>
  );
};

export default StakeInput;
