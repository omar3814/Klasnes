
import React, { useState } from 'react';
import { ToastProps } from './Toast';
import { GroupIcon } from './icons/Icons.tsx';
import TermsModal from './TermsModal';
import { supabase } from '../supabaseClient.ts';

interface AuthProps {
  setToast: (toast: Omit<ToastProps, 'onDismiss'>) => void;
}

const Auth: React.FC<AuthProps> = ({ setToast }) => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'signIn' | 'signUp' | 'forgotPassword' | 'updatePassword'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          terms_accepted: true,
          accepted_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      setToast({ type: 'error', message: error.message });
    } else {
      setToast({ type: 'success', message: 'Confirmation email sent! Please check your inbox.' });
      setView('signIn'); // Go back to sign in after successful sign up request
    }
    setShowTerms(false);
    setLoading(false);
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (view === 'signUp') {
      setShowTerms(true);
      setLoading(false);
      return;
    }

    // Sign In
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setToast({ type: 'error', message: error.message });
    }
    // Success is handled by the onAuthStateChange listener in App.tsx
    setLoading(false);
  };

  const handlePasswordResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Supabase will append reset tokens to this URL
    });
    if (error) {
      setToast({ type: 'error', message: error.message });
    } else {
      setToast({ type: 'info', message: 'Password reset link sent! Check your email.' });
      setView('signIn');
    }
    setLoading(false);
  };
  
  // This part would be handled on a separate page linked from the email.
  // Kept here as a placeholder if building a single-page password reset flow.
  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
     if (error) {
      setToast({ type: 'error', message: error.message });
    } else {
      setToast({ type: 'success', message: 'Password updated successfully!' });
      setView('signIn');
    }
    setLoading(false);
  };

  const getTitle = () => {
    switch (view) {
        case 'forgotPassword': return 'Reset Password';
        case 'updatePassword': return 'Set New Password';
        default: return 'Classroom Manager';
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case 'signUp': return 'Create an account to get started';
      case 'forgotPassword': return 'Enter your email to receive a password reset link';
      case 'updatePassword': return `Enter a new password for ${email}.`;
      case 'signIn':
      default:
        return 'Welcome back! Please sign in';
    }
  };

  const renderForm = () => {
    switch (view) {
        case 'forgotPassword':
            return (
                <form className="space-y-6" onSubmit={handlePasswordResetRequest}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground-muted">
                        Email address
                        </label>
                        <div className="mt-1">
                        <input
                            id="email" type="email" autoComplete="email" required autoFocus
                            className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-background disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
            );
        case 'updatePassword':
            return (
                <form className="space-y-6" onSubmit={handleUpdatePassword}>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
                            New Password
                        </label>
                        <div className="mt-1">
                        <input
                            id="password" type="password" required minLength={6}
                            autoComplete="new-password"
                            className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Password should be at least 6 characters.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-background disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            );
        case 'signIn':
        case 'signUp':
        default:
            return (
                <form className="space-y-6" onSubmit={handleAuthSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground-muted">
                        Email address
                        </label>
                        <div className="mt-1">
                        <input
                            id="email" type="email" autoComplete="email" required
                            className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-baseline">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
                                Password
                            </label>
                            {view === 'signIn' && (
                                <button type="button" onClick={() => setView('forgotPassword')} className="text-sm font-medium text-primary hover:text-primary/90">
                                    Forgot your password?
                                </button>
                            )}
                        </div>
                        <div className="mt-1">
                        <input
                            id="password" type="password" required minLength={6}
                            autoComplete={view === 'signUp' ? "new-password" : "current-password"}
                            className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        </div>
                        {view === 'signUp' && <p className="mt-2 text-xs text-muted-foreground">Password should be at least 6 characters.</p>}
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-background disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                        >
                            {loading ? 'Processing...' : (view === 'signUp' ? 'Sign Up' : 'Sign In')}
                        </button>
                    </div>
                </form>
            );
    }
  };

  return (
    <div className="flex justify-center py-8 md:py-16 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-2xl shadow-black/5 p-8 space-y-6 transition-colors duration-300">
          <div className="text-center space-y-4">
             <div className="inline-block p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/30">
                <GroupIcon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {getTitle()}
            </h1>
            <p className="text-foreground-muted">
              {getSubtitle()}
            </p>
          </div>

          {renderForm()}

          <div className="text-center">
            <button
                onClick={() => {
                    if (view === 'forgotPassword' || view === 'updatePassword') {
                        setView('signIn');
                    } else {
                        setView(view === 'signIn' ? 'signUp' : 'signIn');
                    }
                    setPassword('');
                    setOtp('');
                }}
                className="text-sm font-medium text-primary hover:text-primary/90"
            >
                {view === 'signIn'
                    ? "Don't have an account? Sign Up"
                    : (view === 'signUp' || view === 'updatePassword')
                    ? 'Already have an account? Sign In'
                    : 'Back to Sign In'}
            </button>
          </div>
        </div>
      </div>
      {showTerms && <TermsModal onAccept={handleSignUp} onCancel={() => setShowTerms(false)} />}
    </div>
  );
};

export default Auth;
