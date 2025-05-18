import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import '../styles/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DeviceStatusHistory {
  timestamp: string;
  online: number;
  offline: number;
}

interface Device {
  id: string;
  type: string;
  status: 'online' | 'offline';
  lastUpdate: Date;
  data: {
    temperatura?: string;
    sonido?: number;
    movimiento?: boolean;
    timestamp: string;
  };
}

interface NetworkStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  networkQuality: number;
  activeCameras: number;
  motionDetected: number;
}

interface IncomingDevice {
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
  networkStats: NetworkStats;
  devices: IncomingDevice[];
}

const Dashboard: React.FC = () => {
  const { lastMessage } = useWebSocket();
  const chartRefs = useRef<{ [key: string]: ChartJS | null }>({
    temperature: null,
    sound: null,
    motion: null,
    deviceStatus: null,
    networkQuality: null
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    networkQuality: 0,
    activeCameras: 0,
    motionDetected: 0
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [temperatureHistory, setTemperatureHistory] = useState<{ value: number; timestamp: string }[]>([]);
  const [soundHistory, setSoundHistory] = useState<{ value: number; timestamp: string }[]>([]);
  const [motionHistory, setMotionHistory] = useState<{ value: number; timestamp: string }[]>([]);
  const [deviceStatusHistory, setDeviceStatusHistory] = useState<DeviceStatusHistory[]>([]);
  const [networkQualityHistory, setNetworkQualityHistory] = useState<{ value: number; timestamp: string }[]>([]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = lastMessage as WebSocketMessage;
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'init' || data.type === 'update') {
          // Update network stats
          setNetworkStats({
            totalDevices: data.networkStats.totalDevices,
            onlineDevices: data.networkStats.onlineDevices,
            offlineDevices: data.networkStats.offlineDevices || 0,
            networkQuality: data.networkStats.networkQuality,
            activeCameras: data.networkStats.activeCameras,
            motionDetected: data.networkStats.motionDetected
          });

          // Update device status history
          setDeviceStatusHistory(prev => {
            const newHistory = [...prev, {
              timestamp: data.timestamp,
              online: data.networkStats.onlineDevices,
              offline: data.networkStats.offlineDevices || 0
            }];
            return newHistory.slice(-20); // Keep last 20 entries
          });

          // Update device table
          setDevices(data.devices.map(device => ({
            id: device.id,
            type: device.type,
            status: device.status,
            lastUpdate: new Date(device.data.timestamp),
            data: device.data
          })));

          // Update temperature history
          const tempReadings = data.devices
            .filter((d: IncomingDevice) => d.type === 'temperature' && d.status === 'online' && d.data.temperatura)
            .map((d: IncomingDevice) => ({
              value: parseFloat(d.data.temperatura!),
              timestamp: d.data.timestamp
            }));
          if (tempReadings.length > 0) {
            setTemperatureHistory(prev => [...prev, ...tempReadings].slice(-20));
          }

          // Update sound history
          const soundReadings = data.devices
            .filter((d: IncomingDevice) => d.type === 'sound' && d.status === 'online' && d.data.sonido)
            .map((d: IncomingDevice) => ({
              value: d.data.sonido!,
              timestamp: d.data.timestamp
            }));
          if (soundReadings.length > 0) {
            setSoundHistory(prev => [...prev, ...soundReadings].slice(-20));
          }

          // Update motion history
          const motionReadings = data.devices
            .filter((d: IncomingDevice) => d.type === 'camera' && d.status === 'online' && d.data.movimiento !== undefined)
            .map((d: IncomingDevice) => ({
              value: d.data.movimiento ? 1 : 0,
              timestamp: d.data.timestamp
            }));
          if (motionReadings.length > 0) {
            setMotionHistory(prev => [...prev, ...motionReadings].slice(-20));
          }

          // Update network quality history
          setNetworkQualityHistory(prev => [...prev, {
            value: data.networkStats.networkQuality,
            timestamp: data.timestamp
          }].slice(-20));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    // Cleanup function to destroy charts when component unmounts
    return () => {
      Object.values(chartRefs.current).forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, []);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Timestamp'
        },
        ticks: {
          callback: function (val, index, ticks) {
            // Opcional: recorta la fecha si es muy larga
            const label = (this.getLabelForValue as any)(val as number) as string;
            return label.length > 8 ? label.slice(11, 19) : label;
          }
        }
      },
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };
  

  const temperatureData = {
    labels: temperatureHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureHistory.map(h => h.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true
      }
    ]
  };

  const soundData = {
    labels: soundHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'Sound Level (dB)',
        data: soundHistory.map(h => h.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        fill: true
      }
    ]
  };

  const motionData = {
    labels: motionHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'Motion Detected',
        data: motionHistory.map(h => h.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true,
        stepped: true
      }
    ]
  };

  const deviceStatusData = {
    labels: deviceStatusHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'Online Devices',
        data: deviceStatusHistory.map(h => h.online),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true
      },
      {
        label: 'Offline Devices',
        data: deviceStatusHistory.map(h => h.offline),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true
      }
    ]
  };

  const networkQualityData = {
    labels: networkQualityHistory.map(h => h.timestamp),
    datasets: [
      {
        label: 'Network Quality (%)',
        data: networkQualityHistory.map(h => h.value),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        fill: true
      }
    ]
  };

  const getDeviceTypeCount = (type: string) => {
    return devices.filter(d => d.type === type).length;
  };

  const getOnlineDeviceTypeCount = (type: string) => {
    return devices.filter(d => d.type === type && d.status === 'online').length;
  };

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Network Monitoring</h1>
            <p className="header-subtitle">Real-time system overview and analytics</p>
          </div>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Network Overview Cards */}
        <div className="cards-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Network Health</h3>
              <div className={`status-dot ${networkStats.networkQuality > 80 ? 'status-online' : networkStats.networkQuality > 60 ? 'status-offline' : 'status-offline'}`}></div>
            </div>
            <p className="card-value">{networkStats.networkQuality}%</p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Device Status</h3>
            </div>
            <div className="card-value">
              <div>{networkStats.onlineDevices} Online</div>
              <div>{networkStats.totalDevices - networkStats.onlineDevices} Offline</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Status</h3>
            </div>
            <div className="card-value">
              <div>{networkStats.activeCameras} Active Cameras</div>
              <div>{networkStats.motionDetected} Motion Events</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Device Distribution</h3>
            </div>
            <div className="card-value">
              <div>{getDeviceTypeCount('temperature')} Temperature Sensors</div>
              <div>{getDeviceTypeCount('sound')} Sound Sensors</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-container">
            <div className="card-header">
              <h3 className="card-title">Temperature Monitoring</h3>
              <span>Last 20 readings</span>
            </div>
            <Line
              ref={(ref) => {
                if (ref) {
                  chartRefs.current.temperature = ref;
                }
              }}
              options={chartOptions}
              data={temperatureData}
            />
          </div>

          <div className="chart-container">
            <div className="card-header">
              <h3 className="card-title">Sound Level Monitoring</h3>
              <span>Last 20 readings</span>
            </div>
            <Line
              ref={(ref) => {
                if (ref) {
                  chartRefs.current.sound = ref;
                }
              }}
              options={chartOptions}
              data={soundData}
            />
          </div>

          <div className="chart-container">
            <div className="card-header">
              <h3 className="card-title">Motion Detection Events</h3>
              <span>Last 20 events</span>
            </div>
            <Line
              ref={(ref) => {
                if (ref) {
                  chartRefs.current.motion = ref;
                }
              }}
              options={chartOptions}
              data={motionData}
            />
          </div>

          <div className="chart-container">
            <div className="card-header">
              <h3 className="card-title">Device Status History</h3>
              <span>Last 20 updates</span>
            </div>
            <Line
              ref={(ref) => {
                if (ref) {
                  chartRefs.current.deviceStatus = ref;
                }
              }}
              options={chartOptions}
              data={deviceStatusData}
            />
          </div>
        </div>

        {/* Network Quality Section */}
        <div className="chart-container">
          <div className="card-header">
            <h3 className="card-title">Network Quality Trend</h3>
            <span>Last 20 measurements</span>
          </div>
          <Line
            ref={(ref) => {
              if (ref) {
                chartRefs.current.networkQuality = ref;
              }
            }}
            options={chartOptions}
            data={networkQualityData}
          />
        </div>

        {/* Device Status Table */}
        <div className="device-table">
          <div className="table-header">
            <h3 className="table-title">Device Status Details</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Reading</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>{device.id}</td>
                  <td>{device.type}</td>
                  <td>
                    <span className={`status-badge ${device.status === 'online' ? 'status-online' : 'status-offline'}`}>
                      {device.status}
                    </span>
                  </td>
                  <td>
                    {device.status === 'online' ? (
                      device.type === 'temperature' ? `${device.data.temperatura}°C` :
                      device.type === 'sound' ? `${device.data.sonido}dB` :
                      device.type === 'camera' ? (device.data.movimiento ? 'Motion Detected' : 'No Motion') :
                      'N/A'
                    ) : 'Offline'}
                  </td>
                  <td>{new Date(device.data.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 