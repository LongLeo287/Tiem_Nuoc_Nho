import { useState, useEffect } from 'react';
import { ShoppingBag, Coffee, Settings as SettingsIcon, Clock, BarChart3, Bell } from 'lucide-react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { Settings } from './components/Settings';
import { OrderHistory } from './components/OrderHistory';
import { StaffView } from './components/StaffView';
import { NotificationsPanel } from './components/NotificationsPanel';
import { CartItem } from './types';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbyZSThw91BcFYhZLV5Jx01M8PN2gOVzpa7SIJTaR8GBzKfhZ4wdQjXPuhRfTjNJG8f4/exec';
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const saved = localStorage.getItem('appsScriptUrl');
    const lastDefault = localStorage.getItem('lastDefaultUrl');
    
    // If we have a new default in the code, and the user hasn't manually changed it from the PREVIOUS default
    if (lastDefault !== DEFAULT_URL) {
      localStorage.setItem('lastDefaultUrl', DEFAULT_URL);
      // If they were using the old default, update them to the new one
      if (!saved || saved.includes('AKfycbx')) { // Simple check for old URL pattern if exact match fails
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
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full tap-active"
        >
          <Bell className="w-5 h-5" />
          {/* We can add a red dot if there are unread notifications, but for now just the bell */}
        </button>
      </header>

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        appsScriptUrl={appsScriptUrl} 
      />

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
      <div className="fixed bottom-6 left-0 right-0 px-6 z-40 pointer-events-none">
        <nav className="max-w-md mx-auto bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-none border border-stone-100 dark:border-stone-800 p-1.5 flex justify-between items-center pointer-events-auto">
          {[
            { to: '/', icon: Coffee, label: 'Menu' },
            { to: '/cart', icon: ShoppingBag, label: 'Giỏ', badge: cartCount },
            { to: '/history', icon: Clock, label: 'Lịch sử' },
            { to: '/staff', icon: BarChart3, label: 'Quản lý' },
            { to: '/settings', icon: SettingsIcon, label: 'Cài đặt' },
          ].map((item, index) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={`${item.to}-${index}`}
                to={item.to}
                id={item.to === '/cart' ? 'bottom-nav-cart' : undefined}
                className={`relative flex items-center justify-center py-2.5 rounded-full transition-all duration-300 tap-active ${
                  isActive ? 'text-white px-4' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 flex-1 px-2'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-pink-500 rounded-full shadow-lg shadow-pink-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <div className="relative">
                    <motion.div
                      animate={isActive ? { 
                        scale: [1, 1.25, 1.15],
                        rotate: [0, -5, 5, 0],
                        y: [0, -3, 0]
                      } : { 
                        scale: 1, 
                        rotate: 0,
                        y: 0 
                      }}
                      transition={{ 
                        duration: 0.4,
                        ease: "easeOut",
                        times: [0, 0.4, 0.7, 1]
                      }}
                    >
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-stone-400 dark:text-stone-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-2 -right-2 text-[10px] font-black min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 shadow-sm transition-colors duration-300 px-0.5 ${
                        isActive ? 'bg-white text-pink-500 border-pink-500' : 'bg-pink-500 text-white border-white dark:border-stone-900'
                      }`}>
                        {item.badge}
                      </motion.span>
                    )}
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span 
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap ml-1 overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
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

