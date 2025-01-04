import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './GroupPage.css';

const GroupPage = () => {
  const [groups, setGroups] = useState([]); // Toate grupurile
  const [userGroups, setUserGroups] = useState([]); // Grupurile filtrate pentru utilizator
  const [groupName, setGroupName] = useState(''); // Numele grupului
  const [groupPassword, setGroupPassword] = useState(''); // Parola grupului
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null); // Rolul utilizatorului
  const db = getFirestore();
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Preluăm grupurile și determinăm rolul utilizatorului
  useEffect(() => {
    if (!user) {
      setError('Te rugăm să te autentifici pentru a vedea grupurile.');
      navigate('/'); // Redirecționează utilizatorul la pagina de login dacă nu este autentificat
      return;
    }

    const fetchGroupsAndRole = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'groups'));
        const allGroups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(allGroups);

        // Determinăm rolul utilizatorului din localStorage
        const role = localStorage.getItem('userRole');
        console.log('userRole from localStorage:', role); // Debugging
        setUserRole(role);

        if (role === 'organizer') {
          // Organizatorul vede grupurile pe care le-a creat
          const organizerGroups = allGroups.filter(group => group.creator === user.email);
          setUserGroups(organizerGroups);
        } else if (role === 'participant') {
          // Participantul vede grupurile din care face parte
          const participantGroups = allGroups.filter(group => group.participants && group.participants.includes(user.email));
          setUserGroups(participantGroups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('A apărut o problemă la încărcarea grupurilor.');
      }
    };

    fetchGroupsAndRole();
  }, [db, user, navigate]);

  // Navigare către harta grupului
  const handleViewMap = (groupId) => {
    navigate(`/map/${groupId}`);
  };

  // Funcție pentru a adăuga un participant la un grup
  const joinGroup = async () => {
    if (!user) {
      setError('Te rugăm să te autentifici pentru a te alătura unui grup.');
      return;
    }

    const group = groups.find(group => group.name === groupName);

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
      if (!groupData.participants.includes(user.email)) {
        groupData.participants.push(user.email);
        await updateDoc(groupRef, { participants: groupData.participants });
        alert('Te-ai alăturat cu succes grupului!');
        
        // Actualizăm lista grupurilor fără a depinde de reload
        setUserGroups(prevGroups => [...prevGroups, group]);
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

      {/* Afișăm grupurile în funcție de rol */}
      <div>
        <h2>{userRole === 'organizer' ? 'Grupurile create de tine' : 'Grupuri din care faci parte'}</h2>
        <div className="group-list">
          {userGroups.length > 0 ? (
            userGroups.map(group => (
              <div key={group.id} className="group-card">
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p>Creator: {group.creator}</p>
                {/* Buton pentru accesarea hărții */}
                <button onClick={() => handleViewMap(group.id)}>Vezi Harta</button>
              </div>
            ))
          ) : (
            <p>{userRole === 'organizer' ? 'Nu ai creat încă niciun grup.' : 'Nu faci parte din niciun grup.'}</p>
          )}
        </div>
      </div>

      {/* Formular pentru a te alătura unui grup (doar pentru participanți) */}
      {userRole === 'participant' && (
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
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={joinGroup}>Alătură-te grupului</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
