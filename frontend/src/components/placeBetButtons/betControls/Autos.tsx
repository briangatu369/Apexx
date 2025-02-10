import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BetState } from "@/stores/useBetStore";
import {
  useState,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  useCallback,
  useEffect,
} from "react";
import { MINIMUM_AUTO_CASHOUT_VALUE } from "@/config/constants";

interface AutoProps {
  betState: BetState;
  areBetActionsDisabled: boolean;
}

const Autos = ({ betState, areBetActionsDisabled }: AutoProps) => {
  const { toggleAutoBet, toggleAutoCashout, autoCashoutAt, setAutoCashoutAt } =
    betState;
  const [inputValue, setInputValue] = useState(autoCashoutAt.toString());

  const handleAutoCashoutChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!/^\d*\.?\d*$/.test(value)) return;

      setInputValue(value);
    },
    [setInputValue]
  );

  const handleAutoCashoutBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      let value = parseFloat(e.target.value);

      if (isNaN(value) || value < MINIMUM_AUTO_CASHOUT_VALUE) {
        value = MINIMUM_AUTO_CASHOUT_VALUE;
      }

      setAutoCashoutAt(value);
      setInputValue(value.toFixed(2));
    },
    [setAutoCashoutAt]
  );

  const handleAutoCashoutKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    let value = parseFloat(inputValue) || MINIMUM_AUTO_CASHOUT_VALUE;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      value = parseFloat((value + 0.1).toFixed(2));
      setAutoCashoutAt(value);
      setInputValue(value.toFixed(2));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      value = parseFloat(
        Math.max(MINIMUM_AUTO_CASHOUT_VALUE, value - 0.1).toFixed(2)
      );
      setAutoCashoutAt(value);
      setInputValue(value.toFixed(2));
    }
  };

  // change setInputValue to avoid confusion to the user
  useEffect(() => {
    if (betState.hasPlacedBet && betState.hasAutoCashout) {
      setInputValue(betState.autoCashoutAt.toFixed(2));
    }
  }, [betState.hasPlacedBet]);

  return (
    <div className="flex justify-between items-center gap-4 text-light-white">
      <div className="flex items-center gap-2">
        <Label htmlFor="autoBet" className="text-[13px] font-normal">
          Auto bet
        </Label>
        <Switch
          id="autoBet"
          disabled={areBetActionsDisabled}
          checked={betState.hasAutoBet}
          onCheckedChange={toggleAutoBet}
          className="data-[state=unchecked]:border-[1px]  
          data-[state=unchecked]:bg-secondary-background
          data-[state=unchecked]:border-light-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label
          htmlFor="autoCashout"
          className="text-sm font-normal text-[13px] "
        >
          Auto Cashout
        </Label>
        <Switch
          id="autoCashout"
          disabled={areBetActionsDisabled}
          checked={betState.hasAutoCashout}
          onCheckedChange={toggleAutoCashout}
          className="data-[state=unchecked]:border-[1px]
          data-[state=unchecked]:bg-secondary-background
          data-[state=unchecked]:border-white/50"
        />

        <div className="relative w-16 bg-main-background  pr-1 py-1 rounded-full flex items-center gap-1">
          <Input
            id="cashoutValue"
            disabled={areBetActionsDisabled || !betState.hasAutoCashout}
            value={inputValue}
            onChange={handleAutoCashoutChange}
            onKeyDown={handleAutoCashoutKeyDown}
            onBlur={handleAutoCashoutBlur}
            type="text"
            aria-label="Auto cashout value"
            className="p-0 h-full border-none text-white px-2"
          />
          <p className="absolute text-[13px] font-bold right-1 translate-y-[-4%]">
            x
          </p>
        </div>
      </div>
    </div>
  );
};

export default Autos;
