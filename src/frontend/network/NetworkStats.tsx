import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useWebSocket } from '../context/WebSocketContext';
import '../styles/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface WebSocketMessage {
  type: 'init' | 'update';
  timestamp: string;
  networkStats: {
    totalDevices: number;
    onlineDevices: number;
    networkQuality: number;
    activeCameras: number;
    motionDetected: number;
  };
  devices: Array<{
    id: string;
    type: string;
    status: 'online' | 'offline';
    data: {
      temperatura?: string;
      sonido?: number;
      movimiento?: boolean;
      timestamp: string;
    };
  }>;
}

const NetworkStats: React.FC = () => {
  const { isConnected, error, lastMessage } = useWebSocket();
  const [networkStats, setNetworkStats] = useState<WebSocketMessage['networkStats']>({
    totalDevices: 0,
    onlineDevices: 0,
    networkQuality: 0,
    activeCameras: 0,
    motionDetected: 0
  });
  const [temperatureHistory, setTemperatureHistory] = useState<{ value: number; timestamp: string }[]>([]);
  const [soundHistory, setSoundHistory] = useState<{ value: number; timestamp: string }[]>([]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = lastMessage as WebSocketMessage;
        
        if (data.type === 'init' || data.type === 'update') {
          // Update network stats
          if (data.networkStats) {
            setNetworkStats({
              totalDevices: data.networkStats.totalDevices || 0,
              onlineDevices: data.networkStats.onlineDevices || 0,
              networkQuality: data.networkStats.networkQuality || 0,
              activeCameras: data.networkStats.activeCameras || 0,
              motionDetected: data.networkStats.motionDetected || 0
            });
          }

          // Update sensor history
          if (data.devices && Array.isArray(data.devices)) {
            data.devices.forEach(device => {
              if (device.status === 'online' && device.data) {
                if (device.data.temperatura) {
                  setTemperatureHistory(prev => {
                    const newHistory = [...prev, {
                      value: parseFloat(device.data.temperatura!),
                      timestamp: device.data.timestamp
                    }];
                    return newHistory.slice(-20); // Keep last 20 readings
                  });
                }
                if (device.data.sonido) {
                  setSoundHistory(prev => {
                    const newHistory = [...prev, {
                      value: device.data.sonido!,
                      timestamp: device.data.timestamp
                    }];
                    return newHistory.slice(-20); // Keep last 20 readings
                  });
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  }, [lastMessage]);

  const temperatureData = {
    labels: temperatureHistory.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureHistory.map(h => h.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const soundData = {
    labels: soundHistory.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sound Level (dB)',
        data: soundHistory.map(h => h.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-time Sensor Data',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h2 className="header-title">Network Statistics</h2>
        
        {error && (
          <div className="card" style={{ backgroundColor: '#fbe9e7', color: '#d32f2f' }}>
            {error}
          </div>
        )}

        {!isConnected && !error && (
          <div className="card" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
            Connecting to server...
          </div>
        )}
        
        <div className="cards-grid">
          <div className="card">
            <h3 className="card-title">Total Devices</h3>
            <p className="card-value">{networkStats.totalDevices}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Online Devices</h3>
            <p className="card-value">{networkStats.onlineDevices}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Network Quality</h3>
            <p className="card-value">{networkStats.networkQuality}%</p>
          </div>
          <div className="card">
            <h3 className="card-title">Active Cameras</h3>
            <p className="card-value">{networkStats.activeCameras}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Motion Detected</h3>
            <p className="card-value">{networkStats.motionDetected}</p>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-container">
            <Line options={options} data={temperatureData} />
          </div>
          <div className="chart-container">
            <Line options={options} data={soundData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats; 