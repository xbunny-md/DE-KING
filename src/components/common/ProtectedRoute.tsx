import { type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, MailCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from './Toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireVerified = false,
}: ProtectedRouteProps) {
  const { user, isAuthReady, isAdmin, isVerified, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="h-8 w-48 glass-subtle rounded-lg animate-pulse mb-4" />
        <div className="h-44 w-full glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireVerified && !isVerified) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20">
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
            <MailCheck className="w-6 h-6" />
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
              Email Verification Required
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Your DE-KING account ({user.email}) must be verified before accessing checkout, listing creation, or saved preferences. Check your inbox for the verification link, or sign in with Google for instant verified access.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await resendVerificationEmail();
                  showToast('Verification email sent. Please check your inbox.', 'success');
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Could not resend verification email.', 'error');
                }
              }}
              className="px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Resend Verification Email
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-medium glass-subtle text-slate-700 dark:text-slate-200 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
            >
              I Have Verified — Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20">
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
            <ShieldAlert className="w-6 h-6" />
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
              Administrator Access Denied
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            This console is restricted to verified DE-KING administrators. Signed in as{' '}
            <span className="font-mono text-xs">{user.email}</span>.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
