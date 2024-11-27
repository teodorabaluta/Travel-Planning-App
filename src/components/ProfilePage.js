// src/components/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();

  useEffect(() => {
    // Verificăm dacă utilizatorul este autentificat
    if (!user) {
      setError('You must be logged in to view your groups.');
      navigate('/');  // Dacă nu este logat, redirecționează la login
      return;
    }

    // Fetch grupuri ale utilizatorului
    const fetchGroups = async () => {
      try {
        const q = query(collection(db, 'groups'), where('creator', '==', user.email));  // Alege grupurile în care utilizatorul este creator
        const querySnapshot = await getDocs(q);
        const allGroups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(allGroups);
      } catch (error) {
        setError('Failed to fetch groups');
      }
    };

    fetchGroups();
  }, [db, user, navigate]);

  const handleCreateGroup = () => {
    navigate('/create-group');  // Navighează la pagina de creare grup
  };

  return (
    <div className="profile-page">
      <h1>Welcome, {user?.email}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h2>Your Groups</h2>
      <div className="group-list">
        {groups.length > 0 ? (
          groups.map(group => (
            <div key={group.id} className="group-card">
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <p>Created by: {group.creator}</p>
            </div>
          ))
        ) : (
          <p>You are not part of any group yet.</p>
        )}
      </div>
      
      <button onClick={handleCreateGroup}>Create New Group</button>
    </div>
  );
};

export default ProfilePage;
