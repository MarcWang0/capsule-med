import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Accès sécurisé à l'objet import.meta.env pour TypeScript
const env = (import.meta as any).env || {};

// Construction de la config. 
// NOTE : Vite remplace statiquement import.meta.env.VITE_... lors du build.
// Si vous utilisez Vercel, assurez-vous que les variables commencent bien par VITE_
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let auth: Auth | null = null;
let db: Firestore | null = null;

const initFirebase = () => {
  try {
    // Vérification stricte des clés critiques
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey.length > 0) {
        console.log("Tentative de connexion Firebase avec Project ID:", firebaseConfig.projectId);
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("✅ Firebase initialisé avec succès (Mode Cloud)");
    } else {
        console.warn("⚠️ Clés Firebase introuvables ou incomplètes.");
        console.warn("Vérifiez que vos variables d'environnement Vercel commencent bien par 'VITE_'");
        console.warn("L'application passe en MODE SIMULATION (Données locales uniquement).");
    }
  } catch (error) {
    console.error("❌ Erreur critique lors de l'initialisation Firebase:", error);
  }
};

initFirebase();

export { auth, db };