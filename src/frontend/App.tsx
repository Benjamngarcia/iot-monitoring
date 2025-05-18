import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NetworkCanvas from './network/NetworkCanvas';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { WebSocketProvider } from './context/WebSocketContext';
import { DeviceProvider } from './context/DeviceContext';
import './styles/navbar.css';

const App: React.FC = () => {
  return (
    <Router>
      <WebSocketProvider>
        <DeviceProvider>
          <div className="min-h-screen bg-gray-50">
            {/* <Navigation /> */}
            <Routes>
              <Route path="/" element={
                <div className="container mx-auto p-4">
                  <NetworkCanvas />
                </div>
              } />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<div>Settings Page</div>} />
              <Route path="/about" element={<div>About Page</div>} />
              <Route path="/privacy" element={<div>Privacy Policy Page</div>} />
              <Route path="/terms" element={<div>Terms of Service Page</div>} />
            </Routes>
            <Footer />
          </div>
        </DeviceProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;
