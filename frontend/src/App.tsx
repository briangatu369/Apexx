import { Toaster } from "sonner";
import NavBar from "./components/NavBar/Index";

function App() {
  // const socket = io("http://localhost:4000");
  // const [hashedServerSeed, setHashedServerSeed] = useState("");
  // const [currentMultiplier, setCurrentMultiplier] = useState(0);

  // useEffect(() => {
  //   socket.on("game:broadcastHashedServerSeed", (data) => {
  //     setHashedServerSeed(data.hashedServerSeed);
  //   });
  //   socket.on("game:broadcastCurrentMultiplier", (data) => {
  //     setCurrentMultiplier(data.currentMultiplier);
  //   });
  // }, []);

  return (
    <div className="text-white ">
      <NavBar />
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default App;
