import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function Auth() {
  const { user, subscription, isTestAccount, signOut } = useAuth();
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

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
          view={authView}
          showLinks={false}
          emailRedirectTo={window.location.origin}
          // Disable email verification requirement
          authOptions={{
            autoConfirmSignUp: true,
            emailRedirectTo: window.location.origin
          }}
        />
        
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

  // Allow test accounts to bypass subscription requirement
  if (!isTestAccount && (!subscription || subscription.status !== 'active')) {
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