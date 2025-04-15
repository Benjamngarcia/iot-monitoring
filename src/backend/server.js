import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// app.use(express.static(path.join(__dirname, "../../dist")));

wss.on("connection", (ws) => {
  console.log("Client connected");
});

setInterval(() => {
  const data = JSON.stringify({
    temperatura: (20 + Math.random() * 10).toFixed(2),
    movimiento: Math.random() > 0.8,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}, 2000);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
