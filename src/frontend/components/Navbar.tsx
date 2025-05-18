import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/assets/logo.png" alt="IoT Monitoring" />
        <h1>IoT Monitoring</h1>
      </Link>
      
      <div className="navbar-menu">
        <Link 
          to="/" 
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/network" 
          className={`navbar-link ${location.pathname === '/network' ? 'active' : ''}`}
        >
          Network
        </Link>
        <Link 
          to="/settings" 
          className={`navbar-link ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          Settings
        </Link>
      </div>
    </nav>
  );
};

export default Navbar; 