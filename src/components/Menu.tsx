import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, Search, Heart, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
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
  const [confirmItem, setConfirmItem] = useState<MenuItem | null>(null);
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);
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
          const catKey = keys.find(k => {
            const lowerK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return lowerK.includes('danh muc') || lowerK.includes('danh_muc') || 
                   lowerK === 'loai' || lowerK.includes('loai mon') || lowerK.includes('loai_mon') ||
                   lowerK.includes('nhom') || 
                   lowerK.includes('phan loai') || lowerK.includes('phan_loai') ||
                   lowerK.includes('category');
          });

          return {
            id: item.Ma_Mon || Math.random().toString(36).substr(2, 9),
            name: item.Ten_Mon || 'Món chưa đặt tên',
            price: Number(item.Gia_Ban) || 0,
            category: catKey && item[catKey] ? String(item[catKey]).trim() : 'Khác',
            isOutOfStock: String(item.Co_San).toUpperCase() === 'FALSE',
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

  const handleAddToCart = (cartItem: CartItem) => {
    addToCart(cartItem);
    setSelectedItem(null);
    setAnimatingItemId(cartItem.id);
    showToast(`Đã thêm ${cartItem.name} vào giỏ hàng`);
    setTimeout(() => setAnimatingItemId(null), 1000);
  };

  const handleAddClick = (item: MenuItem) => {
    if (item.hasCustomizations !== false) {
      setConfirmItem(item);
    } else {
      performAddDirectly(item);
    }
  };

  const performAddDirectly = (item: MenuItem) => {
    addToCart({
      ...item,
      cartItemId: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      size: "Tiêu chuẩn",
      toppings: [],
      unitPrice: item.price,
    });
    setConfirmItem(null);
    setAnimatingItemId(item.id);
    showToast(`Đã thêm ${item.name} vào giỏ hàng`);
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
          className="w-full py-4 bg-stone-900 dark:bg-stone-700 text-white font-bold rounded-2xl tap-active shadow-lg shadow-stone-200 dark:shadow-none"
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
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2">Không thể tải thực đơn</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-xs">
          {error || 'Có lỗi xảy ra khi kết nối với hệ thống. Vui lòng thử lại.'}
        </p>
        <button
          onClick={() => fetchMenu(true)}
          className="w-full py-4 bg-stone-900 dark:bg-stone-700 text-white font-bold rounded-2xl tap-active shadow-lg shadow-stone-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Thử lại
        </button>
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
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-black border-stone-900 dark:border-white shadow-lg shadow-stone-200 dark:shadow-none'
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
      <div className="p-5 grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <MenuItemCard 
                item={item} 
                onOpenModal={() => setSelectedItem(item)} 
                onAddDirectly={() => handleAddClick(item)}
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
        {confirmItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-stone-100 dark:border-stone-800"
            >
              <h3 className="text-xl font-extrabold text-stone-800 dark:text-white mb-3">Tùy chỉnh món?</h3>
              <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                Bạn có muốn tùy chỉnh cho <span className="text-stone-800 dark:text-white font-bold">{confirmItem.name}</span> không?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedItem(confirmItem);
                    setConfirmItem(null);
                  }}
                  className="w-full py-4 rounded-2xl font-bold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20 tap-active"
                >
                  Tùy chỉnh món
                </button>
                <button
                  onClick={() => performAddDirectly(confirmItem)}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-pink-500 tap-active shadow-lg shadow-pink-100 dark:shadow-none"
                >
                  Thêm mặc định
                </button>
                <button
                  onClick={() => setConfirmItem(null)}
                  className="w-full py-4 rounded-2xl font-bold text-stone-400 dark:text-stone-500 tap-active"
                >
                  Bỏ qua
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedItem && (
          <CustomizationModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onAdd={handleAddToCart} 
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
      </AnimatePresence>
    </div>
  );
}

const MenuItemCard: React.FC<{ 
  item: MenuItem; 
  onOpenModal: () => void; 
  onAddDirectly: () => void;
  isAnimating: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}> = ({ item, onOpenModal, onAddDirectly, isAnimating, isFavorite, onToggleFavorite }) => {
  return (
    <div className={`card p-5 flex items-center gap-4 transition-all relative overflow-hidden ${item.isOutOfStock ? 'opacity-70 grayscale bg-stone-50 dark:bg-stone-900' : ''}`}>
      {item.isOutOfStock && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <span className="bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg transform -rotate-12 border-2 border-white dark:border-stone-900">
            Hết hàng
          </span>
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-stone-800 dark:text-white text-lg truncate">{item.name}</h3>
          {isFavorite && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />}
        </div>
        <p className="text-pink-500 font-extrabold text-lg mb-3">
          {item.price.toLocaleString('vi-VN')}đ
        </p>
        <div className="flex gap-2">
          {!item.isOutOfStock && (
            <>
              <button 
                onClick={onAddDirectly}
                disabled={isAnimating}
                className={`p-2.5 rounded-xl tap-active transition-all ${isAnimating ? 'bg-pink-500 text-white' : 'bg-pink-500 text-white shadow-lg shadow-pink-100 dark:shadow-none'}`}
              >
                {isAnimating ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
              {item.hasCustomizations !== false && (
                <button 
                  onClick={onOpenModal}
                  className="px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-sm tap-active border border-stone-100 dark:border-stone-700"
                >
                  Tùy chọn
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <button 
        onClick={onToggleFavorite}
        className="flex-shrink-0 w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center tap-active border border-stone-100 dark:border-stone-700 z-20 relative"
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-300 dark:text-stone-600'}`} />
      </button>
    </div>
  );
}

const CustomizationModal: React.FC<{ item: MenuItem; onClose: () => void; onAdd: (item: CartItem) => void }> = ({ item, onClose, onAdd }) => {
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
            onClick={() => onAdd({
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
            })}
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
