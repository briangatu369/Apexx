import useGameStore from "@/stores/gameStore";
import { twMerge } from "tailwind-merge";

const PreviousMultiplers = () => {
  const previousMultiplers = useGameStore((state) => state.previousMultipliers);

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {previousMultiplers.map((prevMultiplier) => {
          return (
            <div
              key={prevMultiplier.sessionId}
              className="flex justify-center items-center"
            >
              <p
                className={twMerge(
                  "text-error border-[1px] border-white/5  bg-secondary-background text-[12px] font-bold px-2 py-[1px]  rounded-full",
                  prevMultiplier.finalMultiplier > 1.99 && "text-purple-600"
                )}
              >
                {prevMultiplier.finalMultiplier.toFixed(2)}x
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousMultiplers;
