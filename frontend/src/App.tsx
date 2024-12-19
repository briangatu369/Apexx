import { io } from "socket.io-client";
import Login from "./Pages/auth/Login/Login";
import Register from "./Pages/auth/Register/Register";

function App() {
  const socket = io("http://localhost:4000");
  return (
    <div className="text-white">
      <h1 className="text-white">apexx</h1>
      <Register />
      <Login />
    </div>
  );
}

export default App;
