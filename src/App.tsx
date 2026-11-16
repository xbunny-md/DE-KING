import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPage } from './pages/AuthPage';
import { BrandOutletPage } from './pages/BrandOutletPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { CatalogPage } from './pages/CatalogPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { GiftCardsPage } from './pages/GiftCardsPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { SavedItemsPage } from './pages/SavedItemsPage';
import { SellCenterPage } from './pages/SellCenterPage';
import { ShipToPage } from './pages/ShipToPage';
import { subscribeStoreSettings } from './services/firestoreService';

function AppShell() {
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeStoreSettings((s) => {
      if (s?.maintenanceMode) {
        setAnnouncement('Scheduled maintenance notice: some fulfillment updates may be delayed.');
      } else {
        setAnnouncement(s?.announcementText || '');
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen flex flex-col deking-ambient-bg text-slate-900 dark:text-slate-100">
      <Navbar announcementText={announcement} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/category/:slug" element={<CatalogPage />} />
          <Route path="/deals" element={<CatalogPage dealsOnly />} />
          <Route path="/brand-outlet" element={<BrandOutletPage />} />
          <Route path="/gift-cards" element={<GiftCardsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/ship-to" element={<ShipToPage />} />
          <Route path="/sell" element={<SellCenterPage />} />
          <Route
            path="/sell/new"
            element={
              <ProtectedRoute requireVerified>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell/edit/:id"
            element={
              <ProtectedRoute requireVerified>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<CartCheckoutPage />} />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-history"
            element={
              <ProtectedRoute>
                <PurchaseHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<HelpCenterPage />} />
          <Route path="/contact-us" element={<HelpCenterPage defaultContactOpen />} />
          <Route path="/help/:topic" element={<HelpCenterPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin requireVerified>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
