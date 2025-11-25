import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  completedCapsules: number[];
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  markCapsuleAsCompleted: (capsuleId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- MODE SIMULATION (LOCAL STORAGE) ---
  const loadLocalUser = () => {
    const stored = localStorage.getItem('capsule_med_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  };

  const saveLocalUser = (userData: UserData | null) => {
    if (userData) {
      localStorage.setItem('capsule_med_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('capsule_med_user');
    }
    setUser(userData);
  };

  useEffect(() => {
    if (auth) {
      // --- MODE FIREBASE RÉEL ---
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Récupérer les données étendues (progression) depuis Firestore
          if (db) {
            try {
                const docRef = doc(db, 'users', firebaseUser.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                   setUser({ 
                       uid: firebaseUser.uid,
                       email: firebaseUser.email,
                       displayName: firebaseUser.displayName,
                       completedCapsules: docSnap.data().completedCapsules || [] 
                   });
                } else {
                   // Créer le doc s'il n'existe pas (première connexion)
                   const newUser: UserData = {
                     uid: firebaseUser.uid,
                     email: firebaseUser.email,
                     displayName: firebaseUser.displayName,
                     completedCapsules: []
                   };
                   // On utilise setDoc avec merge pour être sûr que le doc est créé
                   await setDoc(docRef, { 
                       completedCapsules: [], 
                       email: firebaseUser.email, 
                       displayName: firebaseUser.displayName 
                   }, { merge: true });
                   
                   setUser(newUser);
                }
            } catch (e) {
                console.error("Erreur lecture Firestore:", e);
                // Fallback UI minimal en cas d'erreur DB
                setUser({ 
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    completedCapsules: [] 
                });
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // --- MODE SIMULATION LOCAL ---
      loadLocalUser();
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Simulation
      await new Promise(r => setTimeout(r, 800));
      const stored = localStorage.getItem('capsule_med_user');
      let existingData = stored ? JSON.parse(stored) : null;
      
      const fakeUser: UserData = {
        uid: existingData?.uid || 'local-user-' + Date.now(),
        email: email,
        displayName: existingData?.displayName || email.split('@')[0],
        completedCapsules: existingData?.completedCapsules || []
      };
      saveLocalUser(fakeUser);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    if (auth) {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      // Init Firestore
      if (db) {
        await setDoc(doc(db, 'users', result.user.uid), {
            completedCapsules: [],
            email: email,
            displayName: name
        });
      }
    } else {
      // Simulation
      await new Promise(r => setTimeout(r, 800));
      const fakeUser: UserData = {
        uid: 'local-user-' + Date.now(),
        email: email,
        displayName: name,
        completedCapsules: []
      };
      saveLocalUser(fakeUser);
    }
  };

  const loginWithGoogle = async () => {
    if (auth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // La logique onAuthStateChanged s'occupera de récupérer/créer le user Firestore
    } else {
      // Simulation Google
      await new Promise(r => setTimeout(r, 800));
      const fakeUser: UserData = {
        uid: 'local-google-user-' + Date.now(),
        email: 'google-user@example.com',
        displayName: 'Google User',
        completedCapsules: []
      };
      saveLocalUser(fakeUser);
    }
  };

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    } else {
      saveLocalUser(null);
    }
  };

  const markCapsuleAsCompleted = async (capsuleId: number) => {
    if (!user) return;
    
    // Éviter les doublons
    if (user.completedCapsules.includes(capsuleId)) return;
    
    const newCompleted = [...user.completedCapsules, capsuleId];

    // 1. Mise à jour Optimiste (Immédiate) de l'UI
    // On force la mise à jour de l'état local TOUT DE SUITE.
    // L'utilisateur verra la coche verte instantanément.
    setUser({ ...user, completedCapsules: newCompleted });

    if (auth && db) {
      try {
          const userRef = doc(db, 'users', user.uid);
          // 2. Sauvegarde en arrière-plan
          // Utilisation de setDoc avec merge:true pour robustesse (crée le doc si manquant)
          await setDoc(userRef, {
            completedCapsules: arrayUnion(capsuleId)
          }, { merge: true });
      } catch (e) {
          console.error("Erreur sauvegarde Firebase:", e);
          // Optionnel : En cas d'erreur réelle, on pourrait rollback l'état ici,
          // mais pour l'expérience utilisateur, on garde souvent l'état optimiste.
      }
    } else {
      // Update Local (Mode Simulation)
      saveLocalUser({ ...user, completedCapsules: newCompleted });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout, markCapsuleAsCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};