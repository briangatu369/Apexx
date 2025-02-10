import BetControl from "./betControls/Index";

const PlaceBetButtons = () => {
  const placeBetButtons = [{ buttonId: 1 }, { buttonId: 2 }];

  return (
    <div className="flex  gap-2">
      {placeBetButtons.map((button) => {
        return <BetControl key={button.buttonId} buttonId={button.buttonId} />;
      })}
    </div>
  );
};

export default PlaceBetButtons;
