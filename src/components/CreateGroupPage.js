import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import './CreateGroupPage.css';

const CreateGroupPage = () => {
  const [groupName, setGroupName] = useState(''); // Numele grupului
  const [description, setDescription] = useState(''); // Descrierea grupului
  const [password, setPassword] = useState(''); // Parola grupului
  const [error, setError] = useState(null); // Mesaj de eroare
  const navigate = useNavigate(); // Redirecționare după crearea grupului
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();

  // Funcția pentru crearea grupului
  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Trebuie să fii autentificat pentru a crea un grup.');
      return;
    }

    // Verificăm dacă toate câmpurile sunt completate
    if (!groupName || !description || !password) {
      setError('Te rugăm să completezi toate câmpurile.');
      return;
    }

    try {
      const token = Math.random().toString(36).substring(2, 15); // Generăm un token unic pentru grup
      const groupData = {
        name: groupName,
        description,
        creator: user.email,
        password, // Adăugăm parola grupului
        participants: [user.email], // Organizatorul este automat participant
        token,
      };

      // Adăugăm grupul în baza de date
      await addDoc(collection(db, 'groups'), groupData);

      // Navigăm către pagina de profil
      navigate('/profile');
    } catch (error) {
      console.error("Eroare la crearea grupului: ", error); // Afisăm eroarea pentru depanare
      setError('Eroare la crearea grupului. Încearcă din nou.');
    }
  };

  return (
    <div className="create-group-page">
      <h1>Create New Group</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleCreateGroup}>
        <input 
          type="text" 
          placeholder="Group Name" 
          value={groupName} 
          onChange={(e) => setGroupName(e.target.value)} 
          required 
        />
        <textarea 
          placeholder="Group Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Group Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
};

export default CreateGroupPage;
