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

function AppContent() {
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('https://script.google.com/macros/s/AKfycbyrs49UuzuJBbTRrYMVSGAAVqvQ1N4u6NDJT2EqcUdjKQo6932ZTCCD4dkSPeV40tWs/exec');

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
    <div className="flex flex-col h-[100dvh] bg-[#FAFAFA] text-stone-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="glass-header px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight flex items-center gap-2">
          {location.pathname === '/' && <Coffee className="w-6 h-6 text-emerald-600" />}
          {getTitle()}
        </h1>
        {location.pathname !== '/cart' && cartCount > 0 && (
          <Link to="/cart" className="relative p-2 bg-emerald-50 text-emerald-600 rounded-full tap-active">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
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
      <nav className="glass-nav shadow-[0_-8px_24px_rgba(0,0,0,0.04)] pb-safe">
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
                  isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <div className="relative mb-1">
                  <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110 fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
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
                    className="absolute -bottom-2 w-1 h-1 bg-emerald-600 rounded-full"
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
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

