import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function Auth() {
  const { user, subscription, isTestAccount } = useAuth();

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
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={window.location.origin}
          showLinks={false}
          view="sign_in"
        />
      </div>
    );
  }

  // Allow test accounts to bypass subscription requirement
  if (!isTestAccount && (!subscription || subscription.status !== 'active')) {
    return (
      <div className="subscription-container">
        <h2>Subscribe to Continue</h2>
        <p>Get unlimited access to Strategy Buddy</p>
        <button onClick={handleSubscribe} className="subscribe-button">
          Subscribe Now
        </button>
      </div>
    );
  }

  return null;
}