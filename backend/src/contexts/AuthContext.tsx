import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Mock mode: Set to true to bypass actual Google OAuth
const MOCK_AUTH_MODE = false;

// Mock user for demo purposes
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_AUTH_MODE) {
      // In mock mode, check localStorage for mock session
      const mockSession = localStorage.getItem('mock_auth_session');
      if (mockSession) {
        setUser(MOCK_USER);
      }
      setLoading(false);
      return;
    }

    // Real auth mode
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (MOCK_AUTH_MODE) {
      // Mock sign-in: just set the mock user
      localStorage.setItem('mock_auth_session', 'true');
      setUser(MOCK_USER);
      return;
    }

    const redirectUrl = `${window.location.origin}/create`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: redirectUrl
      }
    });
  };

  const signOut = async () => {
    if (MOCK_AUTH_MODE) {
      localStorage.removeItem('mock_auth_session');
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
