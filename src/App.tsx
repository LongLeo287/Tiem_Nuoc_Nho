import { useState, useEffect } from 'react';
import { ShoppingBag, Coffee, Settings as SettingsIcon, Clock, BarChart3 } from 'lucide-react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { Settings } from './components/Settings';
import { OrderHistory } from './components/OrderHistory';
import { StaffView } from './components/StaffView';
import { CartItem } from './types';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbwMj2OQ3UqfSQzvQ_oKcWuwqfccPMExZ3259-R1z9AiDEvTN3MRjXbZu6WQoFpHjRUV/exec';
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const saved = localStorage.getItem('appsScriptUrl');
    const lastDefault = localStorage.getItem('lastDefaultUrl');
    
    // If we have a new default in the code, and the user hasn't manually changed it from the PREVIOUS default
    if (lastDefault !== DEFAULT_URL) {
      localStorage.setItem('lastDefaultUrl', DEFAULT_URL);
      // If they were using the old default, update them to the new one
      if (!saved || saved === 'https://script.google.com/macros/s/AKfycbyrs49UuzuJBbTRrYMVSGAAVqvQ1N4u6NDJT2EqcUdjKQo6932ZTCCD4dkSPeV40tWs/exec') {
        localStorage.setItem('appsScriptUrl', DEFAULT_URL);
        return DEFAULT_URL;
      }
    }
    
    return saved || DEFAULT_URL;
  });

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          i.size === item.size &&
          JSON.stringify(i.toppings) === JSON.stringify(item.toppings) &&
          i.temperature === item.temperature &&
          i.sugarLevel === item.sugarLevel &&
          i.iceLevel === item.iceLevel &&
          i.note === item.note
      );
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === existing.cartItemId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateCartItem = (cartItemId: string, updatedItem: CartItem) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? updatedItem : item))
    );
  };

  const clearCart = () => setCart([]);

  const restoreCart = (items: CartItem[]) => setCart(items);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Tiệm Nước Nhỏ';
      case '/cart': return 'Đơn hàng';
      case '/history': return 'Lịch sử';
      case '/staff': return 'Quản lý';
      case '/settings': return 'Cài đặt';
      default: return 'Tiệm Nước Nhỏ';
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-50 dark:bg-black text-stone-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="glass-header px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
          {location.pathname === '/' && <Coffee className="w-6 h-6 text-pink-500" />}
          {getTitle()}
        </h1>
        {location.pathname !== '/cart' && cartCount > 0 && (
          <Link to="/cart" className="relative p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-full tap-active">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-stone-900">
              {cartCount}
            </span>
          </Link>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/" element={
                <Menu 
                  addToCart={addToCart} 
                  appsScriptUrl={appsScriptUrl}
                  onNavigateSettings={() => {}}
                />
              } />
              <Route path="/cart" element={
                <Cart
                  cart={cart}
                  updateQuantity={updateQuantity}
                  updateCartItem={updateCartItem}
                  clearCart={clearCart}
                  restoreCart={restoreCart}
                  appsScriptUrl={appsScriptUrl}
                  onNavigateSettings={() => {}}
                />
              } />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="/staff" element={<StaffView appsScriptUrl={appsScriptUrl} />} />
              <Route path="/settings" element={
                <Settings
                  appsScriptUrl={appsScriptUrl}
                  setAppsScriptUrl={(url) => {
                    setAppsScriptUrl(url);
                    localStorage.setItem('appsScriptUrl', url);
                  }}
                />
              } />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass-nav shadow-[0_-8px_24px_rgba(0,0,0,0.04)] dark:shadow-none pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          {[
            { to: '/', icon: Coffee, label: 'Thực đơn' },
            { to: '/cart', icon: ShoppingBag, label: 'Đơn hàng', badge: cartCount },
            { to: '/history', icon: Clock, label: 'Lịch sử' },
            { to: '/staff', icon: BarChart3, label: 'Quản lý' },
            { to: '/settings', icon: SettingsIcon, label: 'Cài đặt' },
          ].map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center w-full py-1 rounded-2xl transition-all tap-active relative ${
                  isActive ? 'text-pink-500' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                <div className="relative mb-1">
                  <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110 fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-stone-900 shadow-sm animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 bg-pink-500 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  );
}

