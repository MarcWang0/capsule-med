import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    // Mode Simulation Local uniquement
    loadLocalUser();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    // Simulation locale
    await new Promise(r => setTimeout(r, 800)); // Petit délai réaliste
    // On récupère l'utilisateur local s'il existe déjà pour ne pas écraser la progression
    const stored = localStorage.getItem('capsule_med_user');
    let existingData = stored ? JSON.parse(stored) : null;
    
    // En mode simulation, on accepte le login sans vérification de mot de passe stricte
    // ou on recrée une session pour cet email
    const fakeUser: UserData = {
      uid: existingData?.uid || 'local-user-' + Date.now(),
      email: email,
      displayName: existingData?.displayName || email.split('@')[0],
      completedCapsules: existingData?.completedCapsules || []
    };
    saveLocalUser(fakeUser);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    // Simulation locale
    await new Promise(r => setTimeout(r, 800));
    const fakeUser: UserData = {
      uid: 'local-user-' + Date.now(),
      email: email,
      displayName: name,
      completedCapsules: []
    };
    saveLocalUser(fakeUser);
  };

  const logout = async () => {
    saveLocalUser(null);
  };

  const markCapsuleAsCompleted = async (capsuleId: number) => {
    if (!user) return;
    
    // Éviter les doublons
    if (user.completedCapsules.includes(capsuleId)) return;

    const newCompleted = [...user.completedCapsules, capsuleId];

    // Update Local
    const updatedUser = { ...user, completedCapsules: newCompleted };
    saveLocalUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, logout, markCapsuleAsCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};
