import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MailCheck, Shield } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, SHIPPING_COUNTRIES } from '../lib/constants';
import type { AccountType } from '../types';

export function AccountSettingsPage() {
  const {
    user,
    profile,
    isAdmin,
    isVerified,
    updateUserProfile,
    sendPasswordReset,
    resendVerificationEmail,
    logout,
    formatAuthError,
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [shipToCountry, setShipToCountry] = useState('United Republic of Tanzania');
  const [postalCode, setPostalCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setAccountType(profile.accountType || 'personal');
      setBusinessName(profile.businessName || '');
      setPhone(profile.phone || '');
      setShipToCountry(profile.shipToCountry || 'United Republic of Tanzania');
      setPostalCode(profile.postalCode || '');
      setAddressLine(profile.addressLine || '');
    } else if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
    }
  }, [profile, user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      showToast('Please verify your email address before saving profile changes.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        displayName,
        firstName,
        lastName,
        accountType,
        businessName,
        phone,
        shipToCountry,
        postalCode,
        addressLine,
      });
      showToast('Account settings saved to Cloud Firestore.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      showToast(`Password reset email sent to ${user.email}.`, 'success');
    } catch (err) {
      showToast(formatAuthError(err), 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.', 'info');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {BRAND_NAME} Account Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {user?.email} · Role: <span className="capitalize font-medium text-slate-900 dark:text-slate-200">{isAdmin ? 'Admin' : profile?.role || 'buyer'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Open Admin Console
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium glass-subtle text-slate-800 dark:text-slate-200 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {!isVerified && (
        <div className="glass-panel border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <MailCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Email not yet verified
              </p>
              <p className="text-amber-800 dark:text-amber-300/90 text-xs mt-0.5">
                Verify your inbox link to unlock profile edits, selling, and checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await resendVerificationEmail();
                showToast('Verification link sent.', 'success');
              } catch (err) {
                showToast(formatAuthError(err), 'error');
              }
            }}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 whitespace-nowrap transition-colors"
          >
            Resend Link
          </button>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Profile &amp; Default Shipping
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="acc-display" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Display Name *
            </label>
            <input
              id="acc-display"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="acc-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Account Type
            </label>
            <select
              id="acc-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="acc-first" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              First Name
            </label>
            <input
              id="acc-first"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="acc-last" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Last Name
            </label>
            <input
              id="acc-last"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {accountType === 'business' && (
          <div>
            <label htmlFor="acc-biz" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Business Name
            </label>
            <input
              id="acc-biz"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="acc-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              id="acc-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255 700 000 000"
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="acc-country" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Country
            </label>
            <select
              id="acc-country"
              value={shipToCountry}
              onChange={(e) => setShipToCountry(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="acc-postal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Postal Code
            </label>
            <input
              id="acc-postal"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="acc-addr" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Default Street Address
          </label>
          <input
            id="acc-addr"
            type="text"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200/70 dark:border-white/10">
          <button
            type="button"
            onClick={handlePasswordReset}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Send Password Reset Email
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
