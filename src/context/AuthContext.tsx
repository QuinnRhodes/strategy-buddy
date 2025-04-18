import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Subscription } from '../services/supabase';

// Add test emails that don't need subscription
const TEST_EMAILS = ['test@strategybuddy.com', 'test1@strategybuddy.com', 'quinnnumber7@gmail.com', 'test2@strategybuddy.com', 'qrhodes7@outlook.com'];

// Create a mock user for bypassing authentication
const MOCK_USER: User = {
  id: 'bypass-auth-user',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'bypass@strategybuddy.com',
  role: '',
};

// Create a mock subscription for bypassing subscription checks
const MOCK_SUBSCRIPTION: Subscription = {
  id: 'bypass-subscription',
  user_id: 'bypass-auth-user',
  status: 'active',
  price_id: 'mock-price',
  expires_at: new Date(2099, 11, 31).toISOString(), // Far in the future
};

// Environment flag to enable/disable auth bypass
const BYPASS_AUTH = true;

type AuthContextType = {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isTestAccount: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  subscription: null,
  loading: true,
  signOut: async () => {},
  isTestAccount: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // When bypass is enabled, initialize with mock user and subscription
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? MOCK_USER : null);
  const [subscription, setSubscription] = useState<Subscription | null>(BYPASS_AUTH ? MOCK_SUBSCRIPTION : null);
  const [loading, setLoading] = useState(!BYPASS_AUTH);
  const [isTestAccount, setIsTestAccount] = useState(BYPASS_AUTH ? true : false);

  useEffect(() => {
    // Skip auth check if bypass is enabled
    if (BYPASS_AUTH) {
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Set user regardless of email verification status
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id);
        setIsTestAccount(TEST_EMAILS.includes(session.user.email ?? ''));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        // Set user regardless of email verification status
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSubscription(session.user.id);
          setIsTestAccount(TEST_EMAILS.includes(session.user.email ?? ''));
        } else {
          setSubscription(null);
          setIsTestAccount(false);
        }
        setLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return;
    }

    setSubscription(data);
  };

  const signOut = async () => {
    if (BYPASS_AUTH) {
      console.log('Auth bypass is enabled - sign out is deactivated');
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, subscription, loading, signOut, isTestAccount }}>
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