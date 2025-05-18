import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from '../context/WebSocketContext';
import { useDevices } from '../context/DeviceContext';

type DeviceType = "temperature" | "sound" | "computer" | "camera" | "speaker";

interface SensorData {
  temperature?: {
    value: number;
    timestamp: string;
  };
  sound?: {
    value: number;
    timestamp: string;
  };
  camera?: {
    motion: boolean;
    lightLevel: number;
    timestamp: string;
  };
}

interface Node {
  id: string;
  x: number;
  y: number;
  type: DeviceType;
  connections: string[];
  traffic: number;
  name: string;
  status: "online" | "offline";
  quality: number;
  details: string;
  image: HTMLImageElement;
  pulse?: number;
  sensorData?: SensorData;
}

interface Device {
  id: string;
  type: string;
  status: 'online' | 'offline';
  data: {
    temperatura?: string;
    sonido?: number;
    movimiento?: boolean;
    timestamp: string;
  };
}

interface WebSocketMessage {
  type: 'init' | 'update';
  timestamp: string;
  networkStats: {
    totalDevices: number;
    onlineDevices: number;
    networkQuality: number;
    activeCameras: number;
    motionDetected: number;
    offlineDevices: number;
  };
  devices: Device[];
}

const deviceTemplates: { type: DeviceType; name: string; details: string; image: string }[] = [
  { type: "temperature", name: "Sensor T", details: "Sensor de temperatura ambiental", image: "temperatura.png" },
  { type: "temperature", name: "Sensor Temp Pro", details: "Sensor térmico industrial", image: "temperatura.png" },
  { type: "sound", name: "Micrófono M1", details: "Sensor acústico de monitoreo", image: "microfono.png" },
  { type: "sound", name: "Detector Sonar", details: "Captura de sonido direccional", image: "sonar.png" },
  { type: "computer", name: "PC Control", details: "Unidad central de procesamiento", image: "computadora.png" },
  // { type: "computer", name: "Servidor NodeX", details: "Servidor IoT dedicado", image: "servidor.png" },
  { type: "camera", name: "Cam HD", details: "Cámara IP de vigilancia", image: "camara.png" },
  { type: "camera", name: "Lente 360", details: "Cámara de visión amplia", image: "camara.png" },
  { type: "speaker", name: "Bocina IoT", details: "Dispositivo de salida de audio", image: "sonido.png" },
  { type: "speaker", name: "Alarma Sónica", details: "Sirena automatizada", image: "sonido.png" }
];

function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { isConnected, error, lastMessage } = useWebSocket();
  const { registerDevice, unregisterDevice } = useDevices();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [deviceCount, setDeviceCount] = useState(0);
  const [time, setTime] = useState(0);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | "random">("random");
  const [sensorUpdateInterval, setSensorUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const initialNodesCreated = useRef(false);

  // Create initial nodes
  useEffect(() => {
    if (!initialNodesCreated.current) {
      const pcImg = new Image();
      const serverImg = new Image();
      pcImg.src = "/assets/computadora.png";
      serverImg.src = "/assets/servidor.png";
    
      Promise.all([
        new Promise(resolve => pcImg.onload = resolve),
        new Promise(resolve => serverImg.onload = resolve)
      ]).then(() => {
        setNodes([
          {
            id: "server-1",
            x: 500,
            y: 250,
            type: "computer",
            connections: [],
            traffic: 0,
            name: "Servidor NodeX",
            status: "online",
            quality: 100,
            details: "Servidor IoT dedicado",
            image: serverImg
          },
          {
            id: "pc-1",
            x: 300,
            y: 250,
            type: "computer",
            connections: ["server-1"],
            traffic: 0,
            name: "PC Control",
            status: "online",
            quality: 100,
            details: "Unidad central de control",
            image: pcImg
          },
        ]);
        initialNodesCreated.current = true;
      });
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = lastMessage as WebSocketMessage;
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'init' || data.type === 'update') {
          console.log('Processing devices:', data.devices);
          
          // Calculate offline devices count
          const offlineDevices = data.devices.filter(device => device.status === 'offline').length;
          
          // Update network stats with offline devices count
          const updatedNetworkStats = {
            ...data.networkStats,
            offlineDevices: offlineDevices
          };
          
          // Update nodes based on device data
          setNodes(prevNodes => {
            console.log('Current nodes:', prevNodes);
            
            // Create a map of existing nodes for quick lookup
            const nodeMap = new Map(prevNodes.map(node => [node.id, node]));
            const updatedNodes = [...prevNodes];
            
            data.devices.forEach(device => {
              console.log('Processing device:', device);
              
              // Skip if this is one of our initial nodes
              if (device.id === "server-1" || device.id === "pc-1") {
                console.log('Skipping initial node:', device.id);
                return;
              }

              const existingNode = nodeMap.get(device.id);
              if (existingNode) {
                console.log('Updating existing node:', device.id);
                // Update existing node
                existingNode.status = device.status;
                if (device.status === 'online') {
                  existingNode.sensorData = {
                    temperature: device.data.temperatura ? {
                      value: parseFloat(device.data.temperatura),
                      timestamp: device.data.timestamp
                    } : undefined,
                    sound: device.data.sonido ? {
                      value: device.data.sonido,
                      timestamp: device.data.timestamp
                    } : undefined,
                    camera: device.data.movimiento !== undefined ? {
                      motion: device.data.movimiento,
                      lightLevel: 100,
                      timestamp: device.data.timestamp
                    } : undefined
                  };
                }
              } else {
                console.log('Creating new node for device:', device.id);
                // Create new node for newly registered device
                const template = deviceTemplates.find(t => t.type === device.type);
                if (template) {
                  console.log('Found template for device:', template);
                  const { x, y } = generatePosition();
                  const img = new Image();
                  img.src = `/assets/${template.image}`;
                  
                  // Create the node immediately without waiting for image load
                  const newNode: Node = {
                    id: device.id,
                    x,
                    y,
                    type: device.type as DeviceType,
                    connections: [],
                    traffic: 0,
                    name: `${template.name} ${device.id}`,
                    status: device.status,
                    quality: 100,
                    details: template.details,
                    image: img,
                    sensorData: device.status === 'online' ? {
                      temperature: device.data.temperatura ? {
                        value: parseFloat(device.data.temperatura),
                        timestamp: device.data.timestamp
                      } : undefined,
                      sound: device.data.sonido ? {
                        value: device.data.sonido,
                        timestamp: device.data.timestamp
                      } : undefined,
                      camera: device.data.movimiento !== undefined ? {
                        motion: device.data.movimiento,
                        lightLevel: 100,
                        timestamp: device.data.timestamp
                      } : undefined
                    } : undefined
                  };

                  console.log('Created new node:', newNode);

                  // Add the new node to both the map and the array
                  nodeMap.set(device.id, newNode);
                  updatedNodes.push(newNode);

                  // Set up connections after the node is created
                  img.onload = () => {
                    console.log('Image loaded for device:', device.id);
                    setNodes(currentNodes => {
                      const getAllComputers = () => currentNodes.filter(n => n.type === "computer");
                      const getLeastLoadedComputer = () => {
                        const computers = getAllComputers();
                        const loadMap = computers.map(pc => ({
                          pc,
                          load: currentNodes.filter(n => n.connections.includes(pc.id)).length
                        }));
                        return loadMap.sort((a, b) => a.load - b.load)[0]?.pc || computers[0];
                      };

                      const getSecondaryNode = () => currentNodes.find(n => n.name.includes("Servidor")) || currentNodes[0];

                      let connections: string[] = [];
                      if (device.type === "computer") {
                        connections.push(getSecondaryNode().id);
                      } else if (["camera", "sound", "temperature"].includes(device.type)) {
                        const leastLoaded = getLeastLoadedComputer();
                        connections.push(leastLoaded.id);
                        if (!leastLoaded.name.includes("Servidor")) {
                          connections.push(getSecondaryNode().id);
                        }
                      } else if (device.type === "speaker") {
                        const leastLoaded = getLeastLoadedComputer();
                        connections.push(leastLoaded.id);
                      }

                      console.log('Setting connections for device:', device.id, connections);

                      return currentNodes.map(node => 
                        node.id === device.id 
                          ? { ...node, connections }
                          : node
                      );
                    });
                  };
                } else {
                  console.log('No template found for device type:', device.type);
                }
              }
            });
            
            console.log('Final updated nodes:', updatedNodes);
            return updatedNodes;
          });
          
          setDeviceCount(data.networkStats.totalDevices);
          
          // Update the network stats in the WebSocket message
          (data as any).networkStats = updatedNetworkStats;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  }, [lastMessage]);

  const isFarEnough = (x: number, y: number, minDist = 80) => !nodes.some(node => Math.hypot(node.x - x, node.y - y) < minDist);

  const generatePosition = () => {
    let x = 0, y = 0, attempts = 0;
    do {
      x = 100 + Math.random() * 800;
      y = 100 + Math.random() * 500;
      attempts++;
    } while (!isFarEnough(x, y, 120) && attempts < 100);
    return { x, y };
  };

  const addDevice = async () => {
    if (deviceCount >= 10) return;
    
    let template;
    if (selectedDeviceType === "random") {
      template = deviceTemplates[Math.floor(Math.random() * deviceTemplates.length)];
    } else {
      const availableTemplates = deviceTemplates.filter(t => t.type === selectedDeviceType);
      template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    }
    
    try {
      await registerDevice(template.type);
    } catch (err) {
      console.error('Failed to register device:', err);
    }
  };

  const toggleStatusCascade = async (targetId: string, turnOn: boolean, visited = new Set<string>()) => {
    if (visited.has(targetId)) return;
    visited.add(targetId);

    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return;

    // Skip if trying to turn off a default device
    if (!turnOn && (targetId === 'server-1' || targetId === 'pc-1')) {
      return;
    }

    const newStatus = turnOn ? "online" : "offline";
    if (targetNode.status === newStatus) return;

    try {
      if (!turnOn) {
        await unregisterDevice(targetNode.id);
      } else {
        // Reactivate the device
        const response = await fetch('http://localhost:4000/api/devices/reactivate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId: targetNode.id }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to reactivate device');
        }
      }
    } catch (err) {
      console.error('Failed to change device status:', err);
      return; // Stop cascading if operation fails
    }

    setNodes(prev => prev.map(node => {
      if (node.id === targetId) {
        return { ...node, status: newStatus };
      }
      return node;
    }));

    // Only cascade to devices that depend on this one (children)
    const dependentNodes = nodes.filter(node => 
      node.connections.includes(targetId) && 
      !visited.has(node.id)
    );

    // Recursively toggle status for dependent nodes
    for (const dependentNode of dependentNodes) {
      await toggleStatusCascade(dependentNode.id, turnOn, visited);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickedNode = nodes.find(
      node => mouseX >= node.x - 25 && mouseX <= node.x + 25 && mouseY >= node.y - 25 && mouseY <= node.y + 25
    );
    if (clickedNode) {
      toggleStatusCascade(clickedNode.id, clickedNode.status === "offline");
    }
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, start: Node, end: Node, isHovered: boolean) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Draw main line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = isHovered ? "#007bff" : "#aaa";
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Draw traffic animation
    if (start.status === "online" && end.status === "online") {
      const progress = (time % 2000) / 2000;
      const x = start.x + dx * progress;
      const y = start.y + dy * progress;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#007bff";
      ctx.fill();
    }

    // Draw cardinality indicator
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    ctx.beginPath();
    ctx.arc(midX, midY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#007bff";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1:1", midX, midY);
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
    // Draw node glow effect
    if (node.status === "online") {
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35);
      gradient.addColorStop(0, "rgba(0, 123, 255, 0.2)");
      gradient.addColorStop(1, "rgba(0, 123, 255, 0)");
      ctx.beginPath();
      ctx.arc(node.x, node.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw node image
    ctx.drawImage(node.image, node.x - 25, node.y - 25, 50, 50);

    // Draw status indicator
    ctx.beginPath();
    ctx.arc(node.x + 15, node.y - 15, 6, 0, Math.PI * 2);
    ctx.fillStyle = node.status === "online" ? "#4CAF50" : "#f44336";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw quality indicator
    const qualityBarWidth = 40;
    const qualityBarHeight = 4;
    const qualityX = node.x - qualityBarWidth / 2;
    const qualityY = node.y + 30;
    
    ctx.beginPath();
    ctx.rect(qualityX, qualityY, qualityBarWidth, qualityBarHeight);
    ctx.fillStyle = "#e0e0e0";
    ctx.fill();
    
    ctx.beginPath();
    ctx.rect(qualityX, qualityY, (qualityBarWidth * node.quality) / 100, qualityBarHeight);
    ctx.fillStyle = node.quality > 80 ? "#4CAF50" : node.quality > 60 ? "#FFC107" : "#f44336";
    ctx.fill();

    // Draw sensor data if available
    if (node.sensorData && node.status === "online") {
      ctx.font = "12px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      
      let sensorText = "";
      if (node.type === "temperature" && node.sensorData.temperature) {
        // Format temperature to match the chart display
        const temp = node.sensorData.temperature.value;
        sensorText = `${temp.toFixed(1)}°C`;
      } else if (node.type === "sound" && node.sensorData.sound) {
        sensorText = `${node.sensorData.sound.value}dB`;
      } else if (node.type === "camera" && node.sensorData.camera) {
        sensorText = `${node.sensorData.camera.lightLevel}% ${node.sensorData.camera.motion ? "🔴" : "⚪"}`;
      }

      if (sensorText) {
        ctx.fillText(sensorText, node.x, node.y + 45);
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(id => {
        const target = nodes.find(n => n.id === id);
        if (!target) return;
        const isHovered = hoveredNode ? (hoveredNode.id === node.id || hoveredNode.id === id) : false;
        drawConnection(ctx, node, target, isHovered);
      });
    });

    // Draw nodes
    nodes.forEach(node => drawNode(ctx, node));
  };

  const animate = () => {
    setTime(prev => prev + 16); // Approximately 60fps
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const found = nodes.find(
      node => mouseX >= node.x - 25 && mouseX <= node.x + 25 && mouseY >= node.y - 25 && mouseY <= node.y + 25
    );
    setHoveredNode(found ?? null);
    setTooltipPos({ x: e.clientX, y: e.clientY });
    draw();
  };

  return (
    <div style={{ position: "relative", background: "#f5f5f5", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!isConnected && !error && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          Connecting to server...
        </div>
      )}

      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <h2 style={{ margin: 0, color: "#333" }}>Simulación de red</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedDeviceType}
            onChange={(e) => setSelectedDeviceType(e.target.value as DeviceType | "random")}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              backgroundColor: "#fff",
              cursor: "pointer"
            }}
          >
            <option value="random">Tipo aleatorio</option>
            <option value="temperature">Sensor de temperatura</option>
            <option value="sound">Sensor de sonido</option>
            <option value="computer">Computadora</option>
            <option value="camera">Cámara</option>
            <option value="speaker">Bocina</option>
          </select>
          <button
            onClick={addDevice}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: deviceCount < 10 ? "pointer" : "not-allowed",
              opacity: deviceCount < 10 ? 1 : 0.5,
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
            disabled={deviceCount >= 10}
          >
            Agregar dispositivo ({deviceCount}/10)
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          cursor: "pointer",
          background: "#fff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          width: "100%",
          margin: "0 auto",
          maxWidth: "1000px",
          height: "auto"
        }}
      />

      {hoveredNode && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.y + 10,
            left: tooltipPos.x + 10,
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(4px)",
            color: "#333",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            fontSize: "14px",
            zIndex: 10,
            width: "240px",
            border: "1px solid rgba(238, 238, 238, 0.8)"
          }}
        >
          <strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>{hoveredNode.name}</strong>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <b>Estado:</b>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: hoveredNode.status === "online" ? "#4CAF50" : "#f44336",
                display: "inline-block"
              }}
            />
            {hoveredNode.status}
          </div>
          {hoveredNode.sensorData && hoveredNode.status === "online" && (
            <div style={{ marginBottom: "8px" }}>
              <b>Lectura actual:</b>
              {hoveredNode.type === "temperature" && hoveredNode.sensorData.temperature && (
                <span> {hoveredNode.sensorData.temperature.value}°C</span>
              )}
              {hoveredNode.type === "sound" && hoveredNode.sensorData.sound && (
                <span> {hoveredNode.sensorData.sound.value}dB</span>
              )}
              {hoveredNode.type === "camera" && hoveredNode.sensorData.camera && (
                <span> Luz: {hoveredNode.sensorData.camera.lightLevel}% | 
                  Movimiento: {hoveredNode.sensorData.camera.motion ? "Detectado" : "No detectado"}
                </span>
              )}
            </div>
          )}
          <div style={{ marginBottom: "8px" }}>
            <b>Calidad:</b> {hoveredNode.quality}%
            <div
              style={{
                width: "100%",
                height: "4px",
                background: "#e0e0e0",
                borderRadius: "2px",
                marginTop: "4px"
              }}
            >
              <div
                style={{
                  width: `${hoveredNode.quality}%`,
                  height: "100%",
                  background: hoveredNode.quality > 80 ? "#4CAF50" : hoveredNode.quality > 60 ? "#FFC107" : "#f44336",
                  borderRadius: "2px",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{hoveredNode.details}</div>
          <div style={{ fontSize: "12px", color: "#999", borderTop: "1px solid #eee", paddingTop: "8px" }}>
            * Haz click para cambiar el estado del dispositivo
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkCanvas;
