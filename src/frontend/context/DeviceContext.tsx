import React, { createContext, useContext, useState, useCallback } from 'react';

interface Device {
  id: string;
  type: string;
}

interface DeviceContextType {
  devices: Device[];
  loading: boolean;
  error: string | null;
  registerDevice: (deviceType: string) => Promise<void>;
  unregisterDevice: (deviceId: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerDevice = useCallback(async (deviceType: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceType }),
      });

      if (!response.ok) {
        throw new Error('Failed to register device');
      }

      const data = await response.json();
      setDevices(prev => [...prev, { id: data.deviceId, type: deviceType }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register device');
    } finally {
      setLoading(false);
    }
  }, []);

  const unregisterDevice = useCallback(async (deviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/devices/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unregister device');
      }

      setDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unregister device');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DeviceContext.Provider value={{ devices, loading, error, registerDevice, unregisterDevice }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}; 