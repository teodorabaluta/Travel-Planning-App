import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase'; // Importăm auth din firebase
import './GroupPage.css'; // Importăm fișierul CSS pentru stil

const GroupPage = () => {
  const [groups, setGroups] = useState([]); // Toate grupurile
  const [userGroups, setUserGroups] = useState([]); // Grupurile din care face parte utilizatorul
  const [groupName, setGroupName] = useState(''); // Numele grupului pe care vrei să îl cauți
  const [groupPassword, setGroupPassword] = useState(''); // Parola grupului
  const [error, setError] = useState('');
  const db = getFirestore();
  const user = auth.currentUser; // Obținem utilizatorul curent

  // Preluăm grupurile disponibile și grupurile din care face parte utilizatorul
  useEffect(() => {
    if (!user) {
      // Dacă utilizatorul nu este autentificat, oprește orice operație
      setError('Te rugăm să te autentifici pentru a vedea grupurile.');
      return;
    }

    const fetchGroups = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'groups'));
        const allGroups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(allGroups);

        // Filtrăm grupurile în care utilizatorul este deja participant
        const userGroups = allGroups.filter(group => group.participants && group.participants.includes(user.email));
        setUserGroups(userGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('A apărut o problemă la încărcarea grupurilor.');
      }
    };

    fetchGroups();
  }, [db, user]);

  // Funcția pentru a adăuga un participant la un grup
  const joinGroup = async () => {
    if (!user) {
      setError('Te rugăm să te autentifici pentru a te alătura unui grup.');
      return;
    }

    const group = groups.find(group => group.name === groupName);

    // Verificăm dacă grupul există și dacă parola este corectă
    if (!group) {
      setError('Grupul nu există.');
      return;
    }
    if (group.password !== groupPassword) {
      setError('Parola este incorectă.');
      return;
    }

    const groupRef = doc(db, 'groups', group.id);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      const groupData = groupDoc.data();
      // Verificăm dacă utilizatorul este deja membru
      if (!groupData.participants.includes(user.email)) {
        groupData.participants.push(user.email);
        await updateDoc(groupRef, { participants: groupData.participants });
        alert('Te-ai alăturat cu succes grupului!');
        window.location.reload(); // Încărcăm din nou grupurile pentru a actualiza lista
      } else {
        alert('Ești deja membru al acestui grup.');
      }
    } else {
      setError('Grupul nu există sau nu poate fi accesat.');
    }
  };

  return (
    <div className="groups-page">
      <h1>Grupurile tale</h1>

      {/* Grupurile din care face parte utilizatorul */}
      <div>
        <h2>Grupuri din care faci parte</h2>
        <div className="group-list">
          {userGroups.length > 0 ? (
            userGroups.map(group => (
              <div key={group.id} className="group-card">
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p>Creator: {group.creator}</p>
              </div>
            ))
          ) : (
            <p>Nu faci parte din niciun grup.</p>
          )}
        </div>
      </div>

      {/* Form pentru a te alătura unui grup */}
      <div>
        <h2>Alătură-te unui grup</h2>
        <div className="join-group-form">
          <input
            type="text"
            placeholder="Numele grupului"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Parola grupului"
            value={groupPassword}
            onChange={(e) => setGroupPassword(e.target.value)}
          />
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Mesaj de eroare */}
          <button onClick={joinGroup}>Alătură-te grupului</button>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
