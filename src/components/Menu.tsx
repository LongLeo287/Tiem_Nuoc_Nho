import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, Search, Heart, AlertCircle, RefreshCw, ChevronRight, ShoppingBag, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, CartItem } from '../types';

export const SIZES = [
  { id: 'STD', name: 'Tiêu chuẩn', price: 0 },
];

export const TOPPINGS: { id: string; name: string; price: number }[] = [];

interface MenuProps {
  addToCart: (item: CartItem) => void;
  appsScriptUrl: string;
  onNavigateSettings: () => void;
}

export function Menu({ addToCart, appsScriptUrl, onNavigateSettings }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menu_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc'>('default');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quickAddItem, setQuickAddItem] = useState<{ item: MenuItem, x: number, y: number } | null>(null);
  const [outOfStockItem, setOutOfStockItem] = useState<MenuItem | null>(null);
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchMenu = async (showMainLoader = true) => {
    if (!appsScriptUrl) return;
    
    const shouldShowMainLoader = showMainLoader && menuItems.length === 0;
    if (shouldShowMainLoader) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const response = await fetch(appsScriptUrl + '?action=getMenu');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data)) {
        const mappedData = data.map((item: any) => {
          const keys = Object.keys(item);
          
          // Flexible key detection
          const findKey = (patterns: string[]) => keys.find(k => {
            const lowerK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return patterns.some(p => lowerK.includes(p.toLowerCase()));
          });

          const nameKey = findKey(['ten mon', 'ten_mon', 'name']) || keys.find(k => k.toLowerCase().includes('ten')) || 'Ten_Mon';
          const priceKey = findKey(['gia ban', 'gia_ban', 'price', 'don gia']) || keys.find(k => k.toLowerCase().includes('gia')) || 'Gia_Ban';
          const idKey = findKey(['ma mon', 'ma_mon', 'id']) || keys.find(k => k.toLowerCase().includes('ma')) || 'Ma_Mon';
          const stockKey = findKey(['co san', 'co_san', 'stock', 'trang thai']) || keys.find(k => k.toLowerCase().includes('san')) || 'Co_San';
          const catKey = findKey(['danh muc', 'danh_muc', 'loai', 'nhom', 'phan loai', 'category']);

          return {
            id: item[idKey] || Math.random().toString(36).substr(2, 9),
            name: item[nameKey] || 'Món chưa đặt tên',
            price: Number(item[priceKey]) || 0,
            category: catKey && item[catKey] ? String(item[catKey]).trim() : 'Khác',
            isOutOfStock: String(item[stockKey]).toUpperCase() === 'FALSE' || String(item[stockKey]) === '0',
            hasCustomizations: String(item.hasCustomizations).toUpperCase() !== 'FALSE',
          };
        });

        // Deduplicate items based on normalized name (removing Nóng/Đá)
        const uniqueItemsMap = new Map();
        
        mappedData.forEach((item: any) => {
          // Detect variant type
          const match = item.name.match(/\s*[\(\-]?\s*(Nóng|Đá|Hot|Ice)\s*[\)]?$/i);
          let variantType = 'default';
          if (match) {
            const typeStr = match[1].toLowerCase();
            if (typeStr.includes('nóng') || typeStr.includes('hot')) variantType = 'Nóng';
            else if (typeStr.includes('đá') || typeStr.includes('ice')) variantType = 'Đá';
          }

          // Normalize name
          const normalizedName = item.name
            .replace(/\s*[\(\-]?\s*(Nóng|Đá|Hot|Ice)\s*[\)]?$/i, "")
            .trim();
          
          if (!uniqueItemsMap.has(normalizedName)) {
            // Initialize with current item
            uniqueItemsMap.set(normalizedName, {
              ...item,
              name: normalizedName,
              variants: {
                [variantType]: { id: item.id, price: item.price, isOutOfStock: item.isOutOfStock }
              }
            });
          } else {
            // Update existing item with new variant
            const existingItem = uniqueItemsMap.get(normalizedName);
            if (!existingItem.variants) existingItem.variants = {};
            existingItem.variants[variantType] = { id: item.id, price: item.price, isOutOfStock: item.isOutOfStock };
            
            // Item is out of stock only if ALL variants are out of stock
            existingItem.isOutOfStock = existingItem.isOutOfStock && item.isOutOfStock;

            // If this is the 'Đá' variant, update the base display item to match it (usually preferred default)
            if (variantType === 'Đá') {
               existingItem.id = item.id;
               existingItem.price = item.price;
            }
          }
        });
        
        const uniqueItems = Array.from(uniqueItemsMap.values());

        setMenuItems(uniqueItems);
        localStorage.setItem('menu_data', JSON.stringify(uniqueItems));
      } else {
        throw new Error('Định dạng dữ liệu không hợp lệ');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thực đơn');
      if (menuItems.length > 0) {
        showToast('Không thể cập nhật thực đơn mới nhất');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu(menuItems.length === 0);
    const interval = setInterval(() => {
      fetchMenu(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [appsScriptUrl]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  };

  const CATEGORIES = Array.from(new Set(menuItems.map((item) => item.category)));
  const displayCategories = ['Tất cả', ...CATEGORIES];
  if (favorites.length > 0) {
    displayCategories.splice(1, 0, 'Yêu thích');
  }

  let filteredItems = menuItems;

  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (activeCategory === 'Yêu thích') {
    filteredItems = filteredItems.filter((item) => favorites.includes(item.id));
  } else if (activeCategory !== 'Tất cả') {
    filteredItems = filteredItems.filter((item) => item.category === activeCategory);
  }
  
  if (sortBy === 'price_asc') {
    filteredItems = [...filteredItems].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredItems = [...filteredItems].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name_asc') {
    filteredItems = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleAddToCart = (cartItem: CartItem, e?: React.MouseEvent) => {
    addToCart(cartItem);
    setSelectedItem(null);
    setAnimatingItemId(cartItem.id);
    
    if (e) {
      setFlyingItem({ x: e.clientX, y: e.clientY, id: cartItem.id });
      setTimeout(() => setFlyingItem(null), 800);
    }

    showToast(`Đã thêm ${cartItem.name} vào giỏ hàng`);
    setTimeout(() => setAnimatingItemId(null), 1000);
  };

  const performAddDirectly = (item: MenuItem, type?: 'Mang về' | 'Tại chỗ', x?: number, y?: number) => {
    addToCart({
      ...item,
      cartItemId: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      size: "Tiêu chuẩn",
      toppings: [],
      unitPrice: item.price,
      note: type || '',
    });
    setAnimatingItemId(item.id);

    if (x !== undefined && y !== undefined) {
      setFlyingItem({ x, y, id: item.id });
      setTimeout(() => setFlyingItem(null), 800);
    }

    showToast(`Đã thêm ${item.name} (${type || 'Mặc định'}) vào giỏ hàng`);
    setTimeout(() => setAnimatingItemId(null), 1000);
  };

  if (!appsScriptUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-3xl flex items-center justify-center mb-6 animate-float">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2">Chưa cấu hình dữ liệu</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xs">
          Bạn cần thiết lập đường dẫn Google Apps Script để tải danh sách thực đơn.
        </p>
        <button
          onClick={onNavigateSettings}
          className="w-full py-4 bg-pink-500 text-white font-bold rounded-2xl tap-active shadow-lg shadow-pink-100 dark:shadow-none"
        >
          Đi tới Cài đặt
        </button>
      </div>
    );
  }

  if (isLoading && menuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-pink-100 dark:border-pink-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-stone-500 dark:text-stone-400 font-bold tracking-tight">Đang chuẩn bị thực đơn...</p>
      </div>
    );
  }

  if (error && menuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-10 h-10" />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2">Không thể tải thực đơn</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xs text-sm leading-relaxed">
          {error || 'Có lỗi xảy ra khi kết nối với hệ thống. Vui lòng kiểm tra lại đường dẫn Apps Script hoặc kết nối mạng.'}
        </p>
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => fetchMenu(true)}
            className="w-full py-4 bg-pink-500 text-white font-bold rounded-2xl tap-active shadow-lg shadow-pink-100 dark:shadow-none flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại ngay
          </button>
          <button
            onClick={onNavigateSettings}
            className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-2xl tap-active"
          >
            Kiểm tra Cài đặt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-xl px-5 pt-5 pb-4 space-y-4 border-b border-stone-100/50 dark:border-stone-800/50 shadow-sm transition-colors">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-grow group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pink-500">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm món ngon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11 pr-4 py-3.5 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none font-bold placeholder:font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 tap-active"
              >
                <X className="h-4 w-4 bg-stone-100 dark:bg-stone-800 rounded-full p-0.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchMenu(false)}
            disabled={isRefreshing || isLoading}
            className="flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center bg-white dark:bg-stone-900 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none text-stone-500 dark:text-stone-400 hover:text-pink-500 dark:hover:text-pink-400 tap-active disabled:opacity-50 border border-stone-50 dark:border-stone-800"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-pink-500' : ''}`} />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scroll-smooth">
          {displayCategories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setSearchQuery('');
              }}
              className={`px-5 py-2.5 rounded-[16px] whitespace-nowrap text-[13px] font-bold transition-all tap-active border ${
                activeCategory === category && !searchQuery
                  ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100 dark:shadow-none'
                  : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-100 dark:border-stone-800 shadow-sm dark:shadow-none'
              }`}
            >
              {category === 'Yêu thích' ? (
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {category}
                </span>
              ) : (
                category
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-5 grid grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              layout
              key={`${item.id}-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <MenuItemCard 
                item={item} 
                onOpenModal={() => setSelectedItem(item)} 
                onAddQuick={(e) => setQuickAddItem({ item, x: e.clientX, y: e.clientY })}
                onOutOfStockClick={() => setOutOfStockItem(item)}
                isAnimating={animatingItemId === item.id}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center h-[50vh]">
            <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 rounded-[24px] flex items-center justify-center mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-stone-800 dark:text-white font-black text-lg mb-2">Không tìm thấy món nào</h3>
            <p className="text-stone-400 dark:text-stone-500 font-medium text-sm max-w-[200px]">Thử tìm từ khóa khác hoặc chọn danh mục khác xem sao</p>
          </div>
        )}
      </div>

      {/* Modals & Toasts */}
      <AnimatePresence>
        {selectedItem && (
          <CustomizationModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onAdd={handleAddToCart} 
          />
        )}

        {quickAddItem && (
          <QuickAddPanel 
            item={quickAddItem.item}
            onClose={() => setQuickAddItem(null)}
            onAdd={(type) => {
              performAddDirectly(quickAddItem.item, type, quickAddItem.x, quickAddItem.y);
              setQuickAddItem(null);
            }}
          />
        )}

        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-[60]"
          >
            <div className="bg-stone-900 dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 dark:border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold">{toast.message}</span>
              </div>
              <button onClick={() => setToast({ ...toast, visible: false })} className="text-stone-400 dark:text-stone-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {error && menuItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-[60]"
          >
            <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Lỗi cập nhật thực đơn</span>
              </div>
              <button 
                onClick={() => fetchMenu(false)} 
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
              >
                Thử lại
              </button>
            </div>
          </motion.div>
        )}

        {outOfStockItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={() => setOutOfStockItem(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-[32px] p-6 max-w-sm w-full mx-4 shadow-2xl border border-stone-100 dark:border-stone-800 text-center"
            >
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400 dark:text-stone-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-stone-800 dark:text-white mb-2">Món này đã hết hàng</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
                Rất tiếc, <strong>{outOfStockItem.name}</strong> hiện tại đã hết. Vui lòng chọn món khác nhé!
              </p>
              <button 
                onClick={() => setOutOfStockItem(null)}
                className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-white font-bold rounded-2xl tap-active"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}

        {/* Fly to Cart Animation */}
        <AnimatePresence>
          {flyingItem && (() => {
            const cartIcon = document.getElementById('bottom-nav-cart');
            const rect = cartIcon?.getBoundingClientRect();
            const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const targetY = rect ? rect.top + rect.height / 2 : window.innerHeight - 60;

            return (
              <motion.div
                key={`flying-${flyingItem.id}-${flyingItem.x}-${flyingItem.y}`}
                initial={{ 
                  x: flyingItem.x - 20, 
                  y: flyingItem.y - 20, 
                  scale: 1, 
                  opacity: 1 
                }}
                animate={{ 
                  x: [flyingItem.x - 20, (flyingItem.x + targetX) / 2 + 100, targetX - 20], 
                  y: [flyingItem.y - 20, (flyingItem.y + targetY) / 2 - 150, targetY - 20], 
                  scale: [1, 1.2, 0.3], 
                  opacity: [1, 0.8, 0] 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.4, 1]
                }}
                className="fixed z-[100] w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)] pointer-events-none"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                  className="absolute inset-0 bg-pink-400 rounded-full -z-10"
                />
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

const MenuItemCard: React.FC<{ 
  item: MenuItem; 
  onOpenModal: () => void; 
  onAddQuick: (e: React.MouseEvent) => void;
  onOutOfStockClick: () => void;
  isAnimating: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}> = ({ item, onOpenModal, onAddQuick, onOutOfStockClick, isAnimating, isFavorite, onToggleFavorite }) => {
  return (
    <motion.div 
      whileTap={{ scale: 1.02 }}
      onClick={() => !item.isOutOfStock && onOpenModal()}
      className={`group relative bg-white dark:bg-stone-900 rounded-[32px] p-4 flex flex-col h-full border border-stone-100 dark:border-stone-800 transition-all hover:shadow-md cursor-pointer ${item.isOutOfStock ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Out of Stock Overlay */}
      {item.isOutOfStock && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[1px] rounded-[32px]">
          <span className="bg-stone-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Hết hàng</span>
        </div>
      )}

      {/* Top: Favorite */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all tap-active ${isFavorite ? 'text-pink-500' : 'text-stone-300 dark:text-stone-600'}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle: Info */}
      <div className="flex-grow space-y-1 mb-4">
        <h3 className="font-black text-stone-800 dark:text-white text-[13px] line-clamp-2 leading-tight min-h-[2rem]">{item.name}</h3>
        <p className="text-pink-500 font-black text-base">{item.price.toLocaleString('vi-VN')}đ</p>
      </div>

      {/* Bottom: Actions */}
      <div className="relative mt-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (item.isOutOfStock) {
              onOutOfStockClick();
            } else {
              onAddQuick(e);
            }
          }}
          className={`w-full h-10 rounded-xl flex items-center justify-center shadow-sm tap-active ${item.isOutOfStock ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500' : 'bg-pink-500 text-white'}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const QuickAddPanel: React.FC<{ 
  item: MenuItem; 
  onClose: () => void; 
  onAdd: (type: 'Mang về' | 'Tại chỗ') => void 
}> = ({ item, onClose, onAdd }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-t-[40px] w-full p-8 shadow-2xl space-y-6 border-t border-stone-100 dark:border-stone-800 max-w-lg"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-stone-800 dark:text-white">Chọn hình thức</h3>
            <p className="text-stone-400 dark:text-stone-500 font-medium text-sm">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500 tap-active">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => onAdd('Mang về')}
            className="w-full py-5 bg-pink-500 text-white font-black rounded-2xl shadow-xl shadow-pink-100 dark:shadow-none tap-active text-lg tracking-wider"
          >
            MANG VỀ
          </button>
          <button 
            onClick={() => onAdd('Tại chỗ')}
            className="w-full py-5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-white font-black rounded-2xl border border-stone-200 dark:border-stone-700 tap-active text-lg tracking-wider"
          >
            TẠI CHỖ
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-2 text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest text-[10px]"
        >
          Đóng
        </button>
      </motion.div>
    </div>
  );
};

const CustomizationModal: React.FC<{ item: MenuItem; onClose: () => void; onAdd: (item: CartItem, e: React.MouseEvent) => void }> = ({ item, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [temperature, setTemperature] = useState('Đá');
  const [sugarLevel, setSugarLevel] = useState('Bình thường');
  const [iceLevel, setIceLevel] = useState('Bình thường');
  const [note, setNote] = useState('');

  // Determine base price and ID based on temperature selection
  const getVariant = (temp: string) => {
    if (!item.variants) return null;
    if (temp === 'Nóng') return item.variants['Nóng'];
    if (temp === 'Đá' || temp === 'Đá riêng') return item.variants['Đá'];
    return null;
  };

  const currentVariant = getVariant(temperature);
  const basePrice = currentVariant ? currentVariant.price : item.price;
  const baseId = currentVariant ? currentVariant.id : item.id;

  const finalUnitPrice = basePrice;
  const finalTotalPrice = finalUnitPrice * quantity;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-stone-900 rounded-t-[40px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-t border-stone-100 dark:border-stone-800"
      >
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-stone-50 dark:border-stone-800">
          <div>
            <h2 className="text-2xl font-black text-stone-800 dark:text-white">Tùy chỉnh</h2>
            <p className="text-stone-400 dark:text-stone-500 font-medium text-sm">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500 tap-active">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto px-8 py-6 space-y-10 scrollbar-hide">
          {/* Temperature & Levels */}
          <div className="grid grid-cols-1 gap-8">
            <section>
              <h4 className="text-stone-400 dark:text-stone-500 font-black text-xs uppercase tracking-widest mb-4">Nhiệt độ</h4>
              <div className="flex gap-2">
                {['Nóng', 'Đá', 'Đá riêng'].map(temp => (
                  <button
                    key={temp}
                    onClick={() => setTemperature(temp)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all tap-active ${
                      temperature === temp ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' : 'border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </section>

            {(temperature === 'Đá') && (
              <section>
                <h4 className="text-stone-400 dark:text-stone-500 font-black text-xs uppercase tracking-widest mb-4">Lượng đá</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['Ít', 'Vừa', 'Bình thường'].map(level => (
                    <button
                      key={level}
                      onClick={() => setIceLevel(level)}
                      className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-all tap-active ${
                        iceLevel === level ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' : 'border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-stone-400 dark:text-stone-500 font-black text-xs uppercase tracking-widest mb-4">Lượng đường</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Ít ngọt', 'Vừa', 'Bình thường', 'Ngọt', 'Đường kiêng'].map(level => (
                  <button
                    key={level}
                    onClick={() => setSugarLevel(level === 'Đường kiêng' ? '1 gói đường kiêng' : level)}
                    className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-all tap-active ${
                      (level === 'Đường kiêng' ? sugarLevel === '1 gói đường kiêng' : sugarLevel === level)
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' 
                        : 'border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Note */}
          <section>
            <h4 className="text-stone-400 dark:text-stone-500 font-black text-xs uppercase tracking-widest mb-4">Ghi chú</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Không lấy ống hút..."
              className="input-field p-5 rounded-[24px] resize-none text-sm font-medium"
              rows={2}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white dark:bg-stone-900 border-t border-stone-50 dark:border-stone-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-stone-50 dark:bg-stone-800 rounded-2xl p-1 border border-stone-100 dark:border-stone-700">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-stone-400 dark:text-stone-500 tap-active"><Minus className="w-5 h-5" /></button>
              <span className="w-10 text-center font-black text-xl text-stone-800 dark:text-white">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-stone-400 dark:text-stone-500 tap-active"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="text-right">
              <p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Tổng cộng</p>
              <p className="text-2xl font-black text-pink-500">{finalTotalPrice.toLocaleString()}đ</p>
            </div>
          </div>
          <button
            onClick={(e) => onAdd({
              ...item,
              id: baseId,
              price: basePrice,
              cartItemId: Math.random().toString(36).substr(2, 9),
              quantity,
              size: "Tiêu chuẩn",
              toppings: [],
              unitPrice: finalUnitPrice,
              temperature,
              sugarLevel,
              iceLevel: temperature === 'Đá' ? iceLevel : (temperature === 'Đá riêng' ? 'Bình thường' : undefined),
              note,
            }, e)}
            className="btn-primary shadow-xl shadow-pink-200 dark:shadow-pink-900/20"
          >
            Thêm vào giỏ hàng
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
