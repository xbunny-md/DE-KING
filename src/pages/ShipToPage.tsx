import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { BRAND_NAME, SHIPPING_COUNTRIES } from '../lib/constants';

export function ShipToPage() {
  const { user, profile, isVerified, updateUserProfile } = useAuth();
  const { shippingPref, setShippingPref } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [country, setCountry] = useState(shippingPref.country || 'TZ');
  const [postalCode, setPostalCode] = useState(shippingPref.postalCode || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setShippingPref({ country, postalCode });
    if (user && isVerified && profile) {
      setSaving(true);
      try {
        await updateUserProfile({
          displayName: profile.displayName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          accountType: profile.accountType,
          businessName: profile.businessName,
          phone: profile.phone,
          shipToCountry: country,
          postalCode,
          addressLine: profile.addressLine,
        });
      } catch {
        // non-blocking
      } finally {
        setSaving(false);
      }
    }
    showToast(`Shipping destination updated to ${country}.`, 'success');
    navigate(-1);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
          <MapPin className="w-5 h-5" />
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Set {BRAND_NAME} Shipping Location
          </h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose your delivery country and postal code to tailor checkout and shipping estimates.
        </p>

        <div>
          <label htmlFor="ship-country" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Ship To *
          </label>
          <select
            id="ship-country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
          >
            {SHIPPING_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ship-postal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Postal Code *
          </label>
          <input
            id="ship-postal"
            type="text"
            required
            maxLength={24}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="e.g. 14111"
            className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </form>
    </div>
  );
}
