import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cleanText, LIMITS } from '../lib/validation';
import type { CartItem, Product, SavedItem, ShippingPreference } from '../types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cartItems: CartItem[];
  savedItems: SavedItem[];
  cartCount: number;
  cartSubtotal: number;
  shippingPref: ShippingPreference;
  setShippingPref: (pref: ShippingPreference) => void;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  toggleSaved: (product: Product) => Promise<boolean>;
  isSaved: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const SHIPPING_STORAGE_KEY = 'deking_shipping_pref';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthReady, isVerified } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [shippingPref, setShippingPrefState] = useState<ShippingPreference>(() => {
    try {
      const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ShippingPreference;
    } catch {
      // ignore storage errors
    }
    return { country: 'TZ', postalCode: '' };
  });

  useEffect(() => {
    if (profile?.shipToCountry) {
      setShippingPrefState({
        country: profile.shipToCountry,
        postalCode: profile.postalCode || '',
      });
    }
  }, [profile?.shipToCountry, profile?.postalCode]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setCartItems([]);
      setSavedItems([]);
      return;
    }

    const cartPath = `users/${user.uid}/cart`;
    const unsubCart = onSnapshot(
      collection(db, 'users', user.uid, 'cart'),
      (snap) => {
        setCartItems(snap.docs.map((d) => d.data() as CartItem));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, cartPath)
    );

    const savedPath = `users/${user.uid}/saved`;
    const unsubSaved = onSnapshot(
      collection(db, 'users', user.uid, 'saved'),
      (snap) => {
        setSavedItems(snap.docs.map((d) => d.data() as SavedItem));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, savedPath)
    );

    return () => {
      unsubCart();
      unsubSaved();
    };
  }, [isAuthReady, user]);

  const setShippingPref = (pref: ShippingPreference) => {
    setShippingPrefState(pref);
    try {
      localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(pref));
    } catch {
      // ignore storage errors
    }
  };

  const addToCart = async (product: Product, quantity = 1) => {
    if (!user) throw new Error('Please sign in to add items to your cart.');
    if (!isVerified) throw new Error('Please verify your email address before adding items to cart.');

    const path = `users/${user.uid}/cart/${product.id}`;
    const existing = cartItems.find((item) => item.productId === product.id);
    const nextQty = Math.max(1, Math.min(99, (existing?.quantity || 0) + quantity));

    try {
      if (existing) {
        await updateDoc(doc(db, 'users', user.uid, 'cart', product.id), {
          quantity: nextQty,
          price: product.price,
          title: cleanText(product.title, LIMITS.productTitleMax),
          imageUrl: cleanText(product.imageUrl, LIMITS.imageUrlMax),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', user.uid, 'cart', product.id), {
          productId: product.id,
          title: cleanText(product.title, LIMITS.productTitleMax),
          price: product.price,
          imageUrl: cleanText(product.imageUrl, LIMITS.imageUrlMax),
          sellerId: product.sellerId,
          quantity: nextQty,
          addedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const path = `users/${user.uid}/cart/${productId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'cart', productId), {
        quantity: Math.max(1, Math.min(99, Math.floor(quantity))),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/cart/${productId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const isSaved = (productId: string) =>
    savedItems.some((item) => item.productId === productId);

  const toggleSaved = async (product: Product): Promise<boolean> => {
    if (!user) throw new Error('Please sign in to save items to your watchlist.');
    if (!isVerified) throw new Error('Please verify your email address before saving items.');

    const path = `users/${user.uid}/saved/${product.id}`;
    const alreadySaved = isSaved(product.id);
    try {
      if (alreadySaved) {
        await deleteDoc(doc(db, 'users', user.uid, 'saved', product.id));
        return false;
      } else {
        await setDoc(doc(db, 'users', user.uid, 'saved', product.id), {
          productId: product.id,
          title: cleanText(product.title, LIMITS.productTitleMax),
          price: product.price,
          category: product.category,
          imageUrl: cleanText(product.imageUrl, LIMITS.imageUrlMax),
          savedAt: serverTimestamp(),
        });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () => Number(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        cartCount,
        cartSubtotal,
        shippingPref,
        setShippingPref,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        toggleSaved,
        isSaved,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
