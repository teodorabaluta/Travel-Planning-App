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
      setError('Trebuie să fii logat pentru a vizualiza grupurile.');
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
        setError('Eroare la preluarea grupurilor');
      }
    };

    fetchGroups();
  }, [db, user, navigate]);

  const handleCreateGroup = () => {
    navigate('/create-group');  // Navighează la pagina de creare grup
  };

  const handleViewMap = (groupId) => {
    navigate(`/map/${groupId}`);  // Navighează la pagina de hartă a grupului
  };

  return (
    <div className="profile-page">
      <h1>Bine ai venit, {user?.email}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h2>Grupurile tale</h2>
      <div className="group-list">
        {groups.length > 0 ? (
          groups.map(group => (
            <div key={group.id} className="group-card">
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <p>Creat de: {group.creator}</p>

              {/* Buton pentru vizualizarea hărții grupului */}
              <button onClick={() => handleViewMap(group.id)}>Vezi Harta</button>
            </div>
          ))
        ) : (
          <p>Nu faci parte din niciun grup încă.</p>
        )}
      </div>
      
      <button onClick={handleCreateGroup}>Creează un nou grup</button>
    </div>
  );
};

export default ProfilePage;
