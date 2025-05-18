import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NetworkCanvas from './network/NetworkCanvas';
import Dashboard from './pages/Dashboard';
import Navigation from './components/Navigation';
import { WebSocketProvider } from './context/WebSocketContext';
import { DeviceProvider } from './context/DeviceContext';

function App() {
  return (
    <Router>
      <WebSocketProvider>
        <DeviceProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              <Route path="/" element={
                <div className="container mx-auto p-4">
                  <NetworkCanvas />
                </div>
              } />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </DeviceProvider>
      </WebSocketProvider>
    </Router>
  );
}

export default App;
