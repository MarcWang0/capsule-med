import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration Firebase utilisant les variables d'environnement VITE
// Ces variables doivent être définies dans Vercel
// Utilisation sécurisée de import.meta.env avec fallback pour éviter le crash
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialisation conditionnelle
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
    // On vérifie si la configuration est présente (au moins la clé API)
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialisé avec succès.");
    } else {
        console.warn("Clés Firebase manquantes. L'application fonctionnera en mode simulation (LocalStorage).");
    }
} catch (error) {
    console.warn("Erreur d'initialisation Firebase, passage en mode local.", error);
}

export { auth, db };