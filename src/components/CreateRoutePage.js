// src/components/CreateRoutePage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Navigare între pagini
import './CreateRoutePage.css';  // Importăm fișierul CSS

const CreateRoutePage = () => {
  const [routeName, setRouteName] = useState('');  // Numele rutei
  const [routeDescription, setRouteDescription] = useState('');  // Descrierea rutei
  const navigate = useNavigate();  // Pentru redirecționare

  const handleCreateRoute = (e) => {
    e.preventDefault();

    // Logica pentru a salva ruta (de exemplu, într-o bază de date)
    console.log('Route created:', routeName, routeDescription);

    // După ce ruta este creată, redirecționează utilizatorul înapoi la profil
    navigate('/profile');
  };

  return (
    <div className="create-route-page">
      <h2>Create a New Route</h2>
      <form onSubmit={handleCreateRoute}>
        <input
          type="text"
          placeholder="Route Name"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          required
        />
        <textarea
          placeholder="Route Description"
          value={routeDescription}
          onChange={(e) => setRouteDescription(e.target.value)}
          required
        />
        <button type="submit">Create Route</button>
      </form>
    </div>
  );
};

export default CreateRoutePage;
