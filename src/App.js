import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import ProfilePage from './components/ProfilePage';
import GroupPage from './components/GroupPage';  // Importăm GroupPage
import CreateGroupPage from './components/CreateGroupPage';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import { getDoc, doc } from 'firebase/firestore';  // Adăugăm getDoc pentru a obține documente
import './App.css';

const App = () => {
  const [userRole, setUserRole] = useState(null);  // Starea pentru rolul utilizatorului

  useEffect(() => {
    // Verificăm dacă există un rol salvat în localStorage
    const role = localStorage.getItem('userRole');
    setUserRole(role);  // Setăm rolul în starea componentei
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LoginPage />} />  {/* Pagina de login */}
          
          {/* Pagina de profil, accesibilă doar pentru organizator */}
          <Route path="/profile" element={userRole === 'organizer' ? <ProfilePage /> : <LoginPage />} />
          
          {/* Pagina grupurilor, accesibilă doar pentru participanți */}
          <Route path="/groups" element={userRole === 'participant' ? <GroupPage /> : <LoginPage />} />
          
          {/* Pagina de creare grup, accesibilă doar pentru organizator */}
          <Route path="/create-group" element={userRole === 'organizer' ? <CreateGroupPage /> : <LoginPage />} />
          
          <Route path="/register" element={<RegistrationPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
