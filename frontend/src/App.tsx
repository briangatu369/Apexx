import NavBar from "./components/navBar/Index";
import useValidateJwt from "./hooks/useValidateJwt";
import useConnectSocketIo from "./hooks/useConnectSocketIo";
import useGameStore, { GamePhase } from "./stores/gameStore";
import { useShallow } from "zustand/shallow";
import PlaceBetButtons from "./components/placeBetButtons/Index";
import { Toaster } from "./components/Toaster";
import PreviousMultiplers from "./components/previousMultipliers/Index";

function App() {
  useValidateJwt();
  const { isSocketConnecting, isSocketConnected, socketFailedToConnect } =
    useConnectSocketIo();

  const {
    currentMultiplier,
    hashedServerSeed,
    gamePhase,
    nextGameCountDown,
    finalMultiplier,
  } = useGameStore(
    useShallow((state) => ({
      currentMultiplier: state.currentMultiplier,
      hashedServerSeed: state.hashedServerSeed,
      gamePhase: state.gamePhase,
      nextGameCountDown: state.nextGameCountDown,
      finalMultiplier: state.finalMultiplier,
    }))
  );

  const renderGamePhaseContent = () => {
    const phaseDisplays = {
      [GamePhase.BETTING]: (
        <div className="text-center">
          <h1 className="text-xl font-bold">Next game in...</h1>
          <p className="text-2xl">{nextGameCountDown?.toFixed(2)}</p>
        </div>
      ),
      [GamePhase.CRASHED]: (
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500">Flew Away</h1>
          <p className="text-2xl">{finalMultiplier?.toFixed(2)}x</p>
        </div>
      ),
      [GamePhase.RUNNING]: (
        <div className="text-center">
          <h1 className="text-xl font-bold">Current Multiplier</h1>
          <p className="text-2xl text-green-500">
            {currentMultiplier.toFixed(2)}x
          </p>
        </div>
      ),
      [GamePhase.PREPARING]: (
        <div className="text-center">
          <h2 className="text-lg">Saving Game Analytics</h2>
          <h4 className="text-sm text-gray-500">Game Starting Soon</h4>
        </div>
      ),
    };

    return phaseDisplays[gamePhase] || null;
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <Toaster />

      {/* <div className="container mx-auto px-4 py-8">
        {isSocketConnecting ? (
          <div>connecting</div>
        ) : isSocketConnected ? (
          <div>
            <div className="flex flex-col items-center space-y-4">
              <PreviousMultiplers />
              <div className="w-full max-w-md">{renderGamePhaseContent()}</div>
              <div className="flex gap-4">
                <PlaceBetButtons />
              </div>
            </div>
          </div>
        ) : socketFailedToConnect ? (
          <div>failed to connect</div>
        ) : (
          <div>Unknown Error</div>
        )}
      </div> */}
    </div>
  );
}

export default App;
