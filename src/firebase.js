// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBR2Q4GszcrkyVvmpMJApHQYCW4k3QK2S4",
  authDomain: "isi-app-a14a6.firebaseapp.com",
  projectId: "isi-app-a14a6",
  storageBucket: "isi-app-a14a6.appspot.com",
  messagingSenderId: "774574682929",
  appId: "1:774574682929:web:a1facde3c197459edc3610",
  measurementId: "G-MJCNRK87S5"
};

// Inițializează aplicația Firebase
const app = initializeApp(firebaseConfig);

// Obține instanțele necesare pentru Auth și Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
