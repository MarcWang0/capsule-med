import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration Firebase
// Les variables sont injectées par Vite au build via import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth: Auth | null = null;
let db: Firestore | null = null;

const initFirebase = () => {
  try {
    // Vérification : On s'assure que la clé API est présente
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0 && firebaseConfig.apiKey !== "undefined") {
        
        console.log("🔥 Initialisation Firebase avec Project ID:", firebaseConfig.projectId);
        
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        console.log("✅ Firebase connecté avec succès.");
    } else {
        console.warn("⚠️ Clés Firebase manquantes ou incorrectes.");
        console.warn("L'application tourne en MODE SIMULATION (Stockage local).");
        console.warn("Assurez-vous d'avoir défini les variables d'environnement VITE_FIREBASE_... dans Vercel.");
    }
  } catch (error) {
    console.error("❌ Erreur critique init Firebase:", error);
  }
};

initFirebase();

export { auth, db };