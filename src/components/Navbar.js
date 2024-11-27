// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';  // Folosește Link din react-router-dom pentru navigare

const Navbar = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/create-route">Create Route</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
