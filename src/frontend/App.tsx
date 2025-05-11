import { useEffect, useState } from "react";
import NetworkCanvas from "./network/NetworkCanvas";
import Footer from "./components/Footer";
const socket = new WebSocket("ws://localhost:4000");

function App() {
  const [, setData] = useState<any[]>([]);

  useEffect(() => {
    socket.onmessage = (event) => {
      const d = JSON.parse(event.data);
      setData((prev) => [...prev.slice(-9), d]);
    };
  }, []);

  return (
    <div>
      <NetworkCanvas /> 
      <Footer />
    </div>
  );
}

export default App;
