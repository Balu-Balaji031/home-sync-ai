import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { authService } from '../services/auth.service';
import type { UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  syncAuthenticatedUser: (currentUser: User | null) => Promise<UserProfile | null>;
  refreshAuthenticatedProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  syncAuthenticatedUser: async () => null,
  refreshAuthenticatedProfile: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAuthenticatedUser = useCallback(async (currentUser: User | null) => {
    setUser(currentUser);
    setProfile(null);
    setLoading(true);

    if (!currentUser) {
      setLoading(false);
      return null;
    }

    try {
      const userProfile = await authService.getUserProfile(currentUser.uid);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAuthenticatedProfile = useCallback(async () => {
    if (!auth.currentUser) return null;

    try {
      const userProfile = await authService.getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, syncAuthenticatedUser);

    return () => unsubscribe();
  }, [syncAuthenticatedUser]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, syncAuthenticatedUser, refreshAuthenticatedProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
