import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import GroupPage from './components/GroupPage';
import CreateGroupPage from './components/CreateGroupPage';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import MapComponent from './components/MapComponent';
import './App.css';

const App = () => {
  const [userRole, setUserRole] = useState(null);

  // Preluăm rolul utilizatorului din localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/profile" element={userRole === 'organizer' ? <ProfilePage /> : <LoginPage />} />
          <Route path="/groups" element={userRole === 'participant' || userRole === 'organizer' ? <GroupPage /> : <LoginPage />} />
          <Route path="/create-group" element={userRole === 'organizer' ? <CreateGroupPage /> : <LoginPage />} />
          <Route path="/map/:groupId" element={<MapComponent />} />
          <Route path="/register" element={<RegistrationPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
