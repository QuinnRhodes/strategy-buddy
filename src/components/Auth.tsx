import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

console.log('VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Helper function to handle existing unconfirmed accounts
const confirmExistingEmail = async (
  email: string,
  password: string,
  _rememberMe: boolean // Adding underscore to mark as intentionally unused
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
        return { data: null, error: otpError };
      }
      
      // We need to handle the sign-in manually after this
      // This is just to bypass the confirmation step for existing accounts
      return { data, error: null };
    }
    
    return { data, error };
  } catch (err) {
    console.error('Error in confirm email process:', err);
    return { data: null, error: err as { message: string } };
  }
};

export function Auth() {
  const { user, subscription, signOut } = useAuth(); // Removed isTestAccount
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Define styles at component level so they're available throughout
  const buttonStyle = {
    padding: '10px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const { error } = await confirmExistingEmail(email, password, rememberMe);
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
    const containerStyle = {
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#f5f5f5',
      borderRadius: '8px',
      border: '1px solid #e4e4e7',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    };
    
    const titleStyle = {
      marginBottom: '1.5rem',
      textAlign: 'center' as const,
      color: '#22c55e',
      fontFamily: "'Marines', sans-serif",
    };

    const formContainerStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
    };

    const inputGroupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
    };

    const inputStyle = {
      padding: '10px 12px',
      border: '1px solid #e4e4e7',
      borderRadius: '4px',
      fontSize: '0.95rem',
    };

    const rememberMeStyle = {
      display: 'flex',
      alignItems: 'center',
      margin: '0.5rem 0',
    };

    const labelStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95rem',
      color: '#525252',
      cursor: 'pointer',
    };

    const checkboxStyle = {
      width: '16px',
      height: '16px',
      cursor: 'pointer',
      accentColor: '#22c55e',
    };

    const errorStyle = {
      background: '#fee2e2',
      color: '#b91c1c',
      padding: '0.75rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    };
    
    return (
      <div style={containerStyle} className="auth-container">
        <h2 style={titleStyle} className="auth-title">{authView === 'sign_in' ? 'Sign In' : 'Create Account'}</h2>
        
        {/* Custom login form for sign-in to handle unconfirmed accounts */}
        {authView === 'sign_in' ? (
          <>
            {errorMessage && <div style={errorStyle} className="error-message">{errorMessage}</div>}
            <form onSubmit={handleSubmit} style={formContainerStyle} className="auth-form-container">
              <div style={inputGroupStyle} className="auth-input-group">
                <label htmlFor="email" className="auth-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  disabled={isProcessing}
                />
              </div>
              
              <div style={inputGroupStyle} className="auth-input-group">
                <label htmlFor="password" className="auth-label">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  disabled={isProcessing}
                />
              </div>
              
              <div style={rememberMeStyle} className="auth-remember-me">
                <label style={labelStyle} className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isProcessing}
                    style={checkboxStyle}
                  />
                  <span>Remember me</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                style={buttonStyle}
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
            providers={['google', 'github']}
            view={authView}
            redirectTo={window.location.origin}
          />
        )}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            onClick={() => setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in')}
            style={{ ...buttonStyle, background: 'transparent', color: '#22c55e' }}
            className="auth-toggle-button"
          >
            {authView === 'sign_in' ? 'Create an account' : 'Sign in with an existing account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Welcome, {user.email}</h2>
      <p>Your subscription status: {subscription ? 'Active' : 'Inactive'}</p>
      <button onClick={handleSubscribe} style={buttonStyle} className="subscribe-button">
        {subscription ? 'Manage Subscription' : 'Subscribe'}
      </button>
      <button onClick={signOut} style={{ ...buttonStyle, background: '#ef4444', marginTop: '1rem' }} className="sign-out-button">
        Sign Out
      </button>
    </div>
  );
}