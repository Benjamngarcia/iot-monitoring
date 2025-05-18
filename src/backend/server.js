import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
// import path from "path";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Store registered devices and their data
const registeredDevices = new Map();

// Initialize with default devices
const defaultDevices = [
  {
    id: "server-1",
    type: "computer",
    name: "Servidor NodeX",
    details: "Servidor IoT dedicado",
    status: "online",
    data: { timestamp: new Date().toISOString() }
  },
  {
    id: "pc-1",
    type: "computer",
    name: "PC Control",
    details: "Unidad central de control",
    status: "online",
    data: { timestamp: new Date().toISOString() }
  }
];

// Add default devices to the registry
defaultDevices.forEach(device => {
  registeredDevices.set(device.id, device);
});

// Network statistics
let networkStats = {
  totalDevices: registeredDevices.size,
  onlineDevices: registeredDevices.size,
  networkQuality: 85,
  activeCameras: 0,
  motionDetected: 0
};

// API endpoint to register a new device
app.post('/api/devices/register', (req, res) => {
  const { deviceType } = req.body;
  if (!deviceType) {
    return res.status(400).json({ error: 'Device type is required' });
  }

  const deviceId = `${deviceType}-${Date.now()}`;
  registeredDevices.set(deviceId, {
    id: deviceId,
    type: deviceType,
    status: 'online',
    data: generateDeviceData(deviceType)
  });
  
  // Update network stats
  networkStats.totalDevices = registeredDevices.size;
  networkStats.onlineDevices = registeredDevices.size;
  if (deviceType === 'camera') {
    networkStats.activeCameras++;
  }

  res.json({ 
    deviceId,
    message: `Device ${deviceType} registered successfully`,
    networkStats 
  });
});

// API endpoint to unregister a device
app.post('/api/devices/unregister', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  // Prevent unregistering default devices
  if (deviceId === 'server-1' || deviceId === 'pc-1') {
    return res.status(400).json({ error: 'Cannot unregister default devices' });
  }

  const device = registeredDevices.get(deviceId);
  if (device) {
    if (device.type === 'camera') {
      networkStats.activeCameras = Math.max(0, networkStats.activeCameras - 1);
    }
    registeredDevices.delete(deviceId);
  }
  
  // Update network stats
  networkStats.totalDevices = registeredDevices.size;
  networkStats.onlineDevices = registeredDevices.size;

  res.json({ 
    message: `Device ${deviceId} unregistered successfully`,
    networkStats 
  });
});

// Generate data for a specific device type
function generateDeviceData(deviceType) {
  const timestamp = new Date().toISOString();
  
  switch (deviceType) {
    case 'temperature':
      return {
        temperatura: (20 + Math.random() * 5).toFixed(2),
        timestamp
      };
    case 'sound':
      return {
        sonido: Math.round(30 + Math.random() * 50),
        timestamp
      };
    case 'camera':
      const motion = Math.random() > 0.7;
      if (motion) {
        networkStats.motionDetected++;
      }
      return {
        movimiento: motion,
        timestamp
      };
    default:
      return { timestamp };
  }
}

// app.use(express.static(path.join(__dirname, "../../dist")));

wss.on("connection", (ws) => {
  console.log("Client connected");
  
  // Send initial network stats and device data
  const initialMessage = {
    type: 'init',
    timestamp: new Date().toISOString(),
    networkStats: {
      totalDevices: networkStats.totalDevices,
      onlineDevices: networkStats.onlineDevices,
      networkQuality: networkStats.networkQuality,
      activeCameras: networkStats.activeCameras,
      motionDetected: networkStats.motionDetected
    },
    devices: Array.from(registeredDevices.values())
  };
  
  ws.send(JSON.stringify(initialMessage));
});

// Update device data and broadcast to all clients
setInterval(() => {
  const timestamp = new Date().toISOString();
  
  // Update data for all registered devices
  registeredDevices.forEach((device) => {
    if (device.status === 'online') {
      device.data = generateDeviceData(device.type);
    }
  });

  // Prepare data for broadcast
  const updateMessage = {
    type: 'update',
    timestamp,
    networkStats: {
      totalDevices: networkStats.totalDevices,
      onlineDevices: networkStats.onlineDevices,
      networkQuality: networkStats.networkQuality,
      activeCameras: networkStats.activeCameras,
      motionDetected: networkStats.motionDetected
    },
    devices: Array.from(registeredDevices.values())
  };

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(updateMessage));
    }
  });
}, 3000);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
