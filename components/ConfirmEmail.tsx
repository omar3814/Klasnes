import React, { useState } from 'react';
import { ToastProps } from './Toast';
import { GroupIcon } from './icons/Icons.tsx';

interface ConfirmEmailProps {
  session: any;
  setToast: (toast: Omit<ToastProps, 'onDismiss'>) => void;
}

const ConfirmEmail: React.FC<ConfirmEmailProps> = ({ session, setToast }) => {
    const [loading, setLoading] = useState(false);

    const handleResendConfirmation = async () => {
        setLoading(true);
        setToast({ type: 'info', message: 'Email confirmation is disabled in this demo.' });
        setLoading(false);
    };

    const handleSignOut = () => {
        // In a real app, this would call supabase.auth.signOut()
        // Here, we can just reload to simulate logging out.
        window.location.reload();
    };

    return (
        <div className="flex justify-center py-8 md:py-16 animate-fade-in">
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-2xl shadow-black/5 p-8 space-y-6 text-center transition-colors duration-300">
              
              <div className="inline-block p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/30">
                  <GroupIcon className="w-8 h-8" />
              </div>

              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Confirm your email
              </h1>
              <p className="text-foreground-muted">
                We've sent a confirmation link to <strong className="text-foreground">{session.user.email}</strong>.
                Please check your inbox and click the link to activate your account.
              </p>
              
              <div className="space-y-4 pt-4">
                <button
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-background disabled:opacity-50"
                >
                    {loading ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
                <button
                    onClick={handleSignOut}
                    className="text-sm font-medium text-foreground-muted hover:text-foreground"
                >
                    Sign out
                </button>
              </div>

              <p className="text-xs text-muted-foreground pt-4">
                  Once confirmed, this page will automatically update.
              </p>

            </div>
          </div>
        </div>
    );
};

export default ConfirmEmail;