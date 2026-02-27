import { useState, useEffect } from 'react';
import { ShoppingBag, Coffee, Settings as SettingsIcon } from 'lucide-react';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { Settings } from './components/Settings';
import { CartItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'settings'>('menu');
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

  return (
    <div className="flex flex-col h-[100dvh] bg-[#fafaf9] text-stone-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 px-6 py-4 flex justify-center items-center">
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight flex items-center gap-2">
          {activeTab === 'menu' && (
            <>
              <Coffee className="w-6 h-6 text-emerald-600" />
              Tiệm Nước Nhỏ
            </>
          )}
          {activeTab === 'cart' && 'Giỏ hàng'}
          {activeTab === 'settings' && 'Cài đặt'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto w-full max-w-2xl mx-auto relative flex flex-col">
        {activeTab === 'menu' && (
          <Menu 
            addToCart={addToCart} 
            appsScriptUrl={appsScriptUrl}
            onNavigateSettings={() => setActiveTab('settings')}
          />
        )}
        {activeTab === 'cart' && (
          <Cart
            cart={cart}
            updateQuantity={updateQuantity}
            updateCartItem={updateCartItem}
            clearCart={clearCart}
            restoreCart={restoreCart}
            appsScriptUrl={appsScriptUrl}
            onNavigateSettings={() => setActiveTab('settings')}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            appsScriptUrl={appsScriptUrl}
            setAppsScriptUrl={(url) => {
              setAppsScriptUrl(url);
              localStorage.setItem('appsScriptUrl', url);
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-lg border-t border-stone-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50">
        <div className="flex justify-around items-center px-2 py-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all ${
              activeTab === 'menu' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Coffee className={`w-6 h-6 mb-1 ${activeTab === 'menu' ? 'fill-emerald-100' : ''}`} />
            <span className="text-[11px] font-bold">Thực đơn</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all relative ${
              activeTab === 'cart' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`w-6 h-6 mb-1 ${activeTab === 'cart' ? 'fill-emerald-100' : ''}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold">Giỏ hàng</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all ${
              activeTab === 'settings' ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <SettingsIcon className={`w-6 h-6 mb-1 ${activeTab === 'settings' ? 'fill-emerald-100' : ''}`} />
            <span className="text-[11px] font-bold">Cài đặt</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
