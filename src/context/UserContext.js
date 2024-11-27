// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';

// Creăm un context pentru utilizator
const UserContext = createContext();

// Provider pentru UserContext
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verifică dacă utilizatorul este autentificat
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

// Hook pentru a folosi UserContext
export const useUser = () => useContext(UserContext);
