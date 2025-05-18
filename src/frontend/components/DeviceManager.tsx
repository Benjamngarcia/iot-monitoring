import React from 'react';
import { useDevices } from '../context/DeviceContext';

const DeviceManager: React.FC = () => {
  const { devices, loading, error, registerDevice, unregisterDevice } = useDevices();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Device Manager</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => registerDevice('temperature')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          Add Thermometer
        </button>
        <button
          onClick={() => registerDevice('sound')}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          Add Sound Sensor
        </button>
        <button
          onClick={() => registerDevice('camera')}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          Add Camera
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Registered Devices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <div
              key={device.id}
              className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold capitalize">{device.type}</p>
                <p className="text-sm text-gray-600">{device.id}</p>
              </div>
              <button
                onClick={() => unregisterDevice(device.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceManager; 