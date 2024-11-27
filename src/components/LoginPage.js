// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Folosim useNavigate
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import './LoginPage.css';
// src/components/LoginPage.js
import { auth } from '../firebase'; // Asigură-te că folosești instanța corectă de auth din firebase


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // Starea pentru rol
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Folosim useNavigate pentru redirecționare

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Salvăm rolul și token-ul în localStorage
      localStorage.setItem('userRole', role);
      localStorage.setItem('userToken', email); // Sau poți salva ID-ul utilizatorului

      // Navigăm în funcție de rol
      if (role === 'organizer') {
        navigate('/profile');
      } else if (role === 'participant') {
        navigate('/groups');
      }
    } catch (err) {
      setError('Login invalid. Please check your credentials.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="role-selection">
          <label>
            <input 
              type="radio" 
              value="organizer" 
              checked={role === 'organizer'} 
              onChange={(e) => setRole(e.target.value)} 
            />
            Organizator
          </label>
          <label>
            <input 
              type="radio" 
              value="participant" 
              checked={role === 'participant'} 
              onChange={(e) => setRole(e.target.value)} 
            />
            Participant
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        Nu ai un cont? <a href="/register">Înregistrează-te aici</a>
      </p>
    </div>
  );
};

export default LoginPage;
