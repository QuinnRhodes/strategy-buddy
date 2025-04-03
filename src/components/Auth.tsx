import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Helper function to handle existing unconfirmed accounts
const confirmExistingEmail = async (
  email: string,
  password: string
): Promise<{ data: any; error: { message: string } | null }> => {
  try {
    // First attempt normal sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If we get an "Email not confirmed" error
    if (error && error.message.includes('Email not confirmed')) {
      console.log('Attempting to confirm unconfirmed email:', email);
      
      // Get OTP for the email
      const { error: otpError } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (otpError) {
        console.error('Error sending confirmation email:', otpError);
        return { error: otpError };
      }
      
      // We need to handle the sign-in manually after this
      // This is just to bypass the confirmation step for existing accounts
      return { data, error: null };
    }
    
    return { data, error };
  } catch (err) {
    console.error('Error in confirm email process:', err);
    return { data: null, error: err };
  }
};

export function Auth() {
  const { user, subscription, isTestAccount, signOut } = useAuth();
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const { error } = await confirmExistingEmail(email, password);
        setErrorMessage(error?.message || 'An unknown error occurred');
      if (error) {
        console.error('Auth error:', error);
        setErrorMessage(error.message);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          userId: user.id,
          userEmail: user.email
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data?.sessionId) {
        console.error('No session ID returned:', data);
        throw new Error('No session ID returned from checkout session creation');
      }

      // Redirect to Stripe checkout
      const { error: stripeError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });
      
      if (stripeError) throw stripeError;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to initiate checkout. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h2 className="auth-title">{authView === 'sign_in' ? 'Sign In' : 'Create Account'}</h2>
        
        {/* Custom login form for sign-in to handle unconfirmed accounts */}
        {authView === 'sign_in' ? (
          <>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <form onSubmit={handleSubmit} className="auth-form-container">
              <div className="auth-input-group">
                <label htmlFor="email" className="auth-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="auth-input-group">
                <label htmlFor="password" className="auth-label">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  disabled={isProcessing}
                />
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={isProcessing}
              >
                {isProcessing ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          // Use standard Supabase Auth UI for sign-up
          <SupabaseAuth 
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              className: {
                container: 'auth-form-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
              }
            }}
            providers={['google']}
            redirectTo={window.location.origin}
            view={'sign_up'}
            showLinks={false}
            emailRedirectTo={window.location.origin.replace('3000', '5173')}
            authOptions={{
              autoConfirmSignUp: true,
              emailRedirectTo: window.location.origin.replace('3000', '5173')
            }}
          />
        )}
        
        <div className="auth-options">
          {authView === 'sign_in' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => setAuthView('sign_up')} 
                className="text-button"
              >
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => setAuthView('sign_in')} 
                className="text-button"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  console.log('isTestAccount:', isTestAccount);
  console.log('user:', user);
  console.log('subscription:', subscription);

  // Allow test accounts to bypass subscription requirement
  if (isTestAccount) {
    return (
      <div className="app-container">
        <h2>Welcome, Test Account!</h2>
        <p>You have full access to Strategy Buddy as a test user.</p>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
    );
  }

  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="subscription-container">
        <h2>Subscribe to Continue</h2>
        <p>Get unlimited access to Strategy Buddy</p>
        
        <div className="subscription-actions">
          <button onClick={handleSubscribe} className="subscribe-button">
            Subscribe Now
          </button>
          
          <button 
            onClick={() => signOut()} 
            className="back-button"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
}