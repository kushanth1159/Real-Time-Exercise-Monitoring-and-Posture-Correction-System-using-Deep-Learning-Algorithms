import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && 
         import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Permanent Guest Session
    const guestUser: User = {
      id: 'guest-user',
      email: 'guest@fitai.coach',
      user_metadata: { full_name: 'Athlete' },
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      created_at: new Date().toISOString(),
    };

    const guestSession: Session = {
      access_token: 'guest_token',
      refresh_token: 'guest_refresh_token',
      expires_in: 3600,
      token_type: 'bearer',
      user: guestUser,
    };

    setSession(guestSession);
    setUser(guestUser);
    setLoading(false);
  }, []);

  const signOut = async () => {
    // No-op - signing out is disabled
    console.log('Sign out disabled');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, isMock: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
