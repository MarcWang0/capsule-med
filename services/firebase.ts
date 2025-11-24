import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
// Ces variables doivent être définies dans votre fichier .env ou via l'interface de déploiement (Vercel)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialisation conditionnelle
let auth = null;
let db = null;

try {
    // On n'initialise Firebase que si une clé est présente
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.log("Mode Simulation: Firebase non configuré (pas de clés API trouvées).");
    }
} catch (error) {
    console.warn("Erreur init Firebase, passage en mode local simulation.", error);
}

export { auth, db };