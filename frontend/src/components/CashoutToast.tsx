import { toast } from "react-toastify";
import Coin from "../assets/coin.png";

interface CashoutToastProps {
  cashoutMultiplier: number | null;
  payout: number | null;
}

const CashoutToaster = ({ cashoutMultiplier, payout }: CashoutToastProps) => {
  return (
    <div className="w-full flex items-center gap-4 rounded-full ">
      <div className="flex items-center gap-2 px-6 py-[5px] bg-green-900 rounded-full">
        <img src={Coin} alt="Gold coin icon" className="w-8 h-8 object-cover" />
        <div className="flex flex-col items-center font-semibold">
          <p className="text-xs">Win KES</p>
          <p className="-mt-[2px] ">{payout?.toFixed(2)}</p>
        </div>
      </div>

      <div className="h-8 w-[0.5px] bg-light-white"></div>

      <div className="flex flex-col items-center text-white/80">
        <p className="text-sm">Cashout At</p>
        <p className="text-white -mt-[3px]">{cashoutMultiplier?.toFixed(2)}x</p>
      </div>
    </div>
  );
};

export const showCashoutToast = ({
  cashoutMultiplier,
  payout,
}: CashoutToastProps) => {
  if (!cashoutMultiplier || !payout) {
    return; // Don't toast
  }

  toast(
    <CashoutToaster cashoutMultiplier={cashoutMultiplier} payout={payout} />,
    {
      className: "bg-green-500/50 py-0 rounded-full",
      icon: false,
      closeButton: ({ closeToast }) => (
        <button
          onClick={closeToast}
          className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-light-white"
        >
          ✕
        </button>
      ),
    }
  );
};

export default CashoutToaster;
