import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, Search, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import { MenuItem, CartItem } from '../types';

export const SIZES = [
  { id: 'S', name: 'Size S', price: 0 },
  { id: 'M', name: 'Size M', price: 5000 },
  { id: 'L', name: 'Size L', price: 10000 },
];

export const TOPPINGS = [
  { id: 'tp1', name: 'Trân châu trắng', price: 5000 },
  { id: 'tp2', name: 'Thạch đào', price: 5000 },
  { id: 'tp3', name: 'Kem cheese', price: 10000 },
];

interface MenuProps {
  addToCart: (item: CartItem) => void;
  appsScriptUrl: string;
  onNavigateSettings: () => void;
}

export function Menu({ addToCart, appsScriptUrl, onNavigateSettings }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc'>('default');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [confirmItem, setConfirmItem] = useState<MenuItem | null>(null);
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchMenu = async (showMainLoader = true) => {
    if (!appsScriptUrl) return;
    if (showMainLoader) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(appsScriptUrl + '?action=getMenu');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data)) {
        // Map the Google Sheet columns to our MenuItem interface
        const mappedData = data.map((item: any) => {
          // Find the category key dynamically by looking for common terms
          const keys = Object.keys(item);
          const catKey = keys.find(k => {
            const lowerK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
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
        setMenuItems(mappedData);
      } else {
        throw new Error('Định dạng dữ liệu không hợp lệ');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thực đơn');
    } finally {
      if (showMainLoader) setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu(true);
    const interval = setInterval(() => {
      fetchMenu(false);
    }, 30000); // Poll every 30 seconds
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

  const handleAddToCart = (cartItem: CartItem) => {
    addToCart(cartItem);
    setSelectedItem(null);
    setAnimatingItemId(cartItem.id);
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
      size: SIZES[0].name,
      toppings: [],
      unitPrice: item.price + SIZES[0].price,
    });
    setConfirmItem(null);
    setAnimatingItemId(item.id);
    setTimeout(() => setAnimatingItemId(null), 1000);
  };

  if (!appsScriptUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Chưa cấu hình dữ liệu</h2>
        <p className="text-stone-500 mb-6 max-w-sm">
          Bạn cần thiết lập đường dẫn Google Apps Script để tải danh sách thực đơn.
        </p>
        <button
          onClick={onNavigateSettings}
          className="px-6 py-3 bg-stone-800 text-white font-bold rounded-2xl hover:bg-stone-900 transition-colors"
        >
          Đi tới Cài đặt
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="animate-spin text-emerald-600 mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-stone-500 font-medium">Đang tải thực đơn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-stone-500 mb-6 max-w-sm">{error}</p>
        <button
          onClick={fetchMenu}
          className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-30 bg-[#fafaf9] px-4 pt-4 pb-3 space-y-4 shadow-sm border-b border-stone-200">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium placeholder:font-normal"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchMenu(false)}
            disabled={isRefreshing || isLoading}
            className="flex-shrink-0 p-3.5 bg-white rounded-2xl shadow-sm text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50"
            title="Làm mới thực đơn"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Categories and Sort */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery('');
                }}
                className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${
                  activeCategory === category && !searchQuery
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                {category === 'Yêu thích' ? (
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-current" />
                    {category}
                  </span>
                ) : (
                  category
                )}
              </button>
            ))}
          </div>
          
          <div className="flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-none bg-white rounded-xl px-4 py-2.5 font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="name_asc">Tên: A-Z</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 pb-24">
        {filteredItems.map((item) => (
          <MenuItemCard 
            key={item.id} 
            item={item} 
            onOpenModal={() => setSelectedItem(item)} 
            onAddDirectly={() => handleAddClick(item)}
            isAnimating={animatingItemId === item.id}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        ))}
      </div>

      {/* Confirmation Dialog for Direct Add */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Tùy chỉnh món?</h3>
            <p className="text-stone-600 mb-6">
              Bạn có muốn chọn size và thêm topping cho <strong>{confirmItem.name}</strong> không, hay thêm trực tiếp với tùy chọn mặc định?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSelectedItem(confirmItem);
                  setConfirmItem(null);
                }}
                className="w-full px-4 py-3 rounded-xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                Tùy chỉnh món
              </button>
              <button
                onClick={() => performAddDirectly(confirmItem)}
                className="w-full px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Thêm mặc định (Size S)
              </button>
              <button
                onClick={() => setConfirmItem(null)}
                className="w-full px-4 py-3 rounded-xl font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onAdd={handleAddToCart} 
        />
      )}
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
    <div className={`bg-white rounded-[24px] shadow-sm border border-stone-100 overflow-hidden flex flex-col relative p-5 transition-all ${item.isOutOfStock ? 'opacity-70 bg-stone-50' : 'hover:shadow-md hover:border-emerald-200'}`}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="font-bold text-stone-800 text-lg leading-tight">
          {item.name}
        </h3>
        <button 
          onClick={onToggleFavorite}
          className="flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-300'}`} />
        </button>
      </div>
      
      {item.isOutOfStock && (
        <div className="mb-3">
          <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
            Hết hàng
          </span>
        </div>
      )}
      
      <p className={`font-extrabold text-lg mb-5 ${item.isOutOfStock ? 'text-stone-500' : 'text-emerald-600'}`}>
        {item.price.toLocaleString('vi-VN')}đ
      </p>
      
      <div className="mt-auto flex gap-2">
        {item.isOutOfStock ? (
          <button
            disabled
            className="w-full py-2.5 px-2 rounded-2xl bg-stone-100 text-stone-400 cursor-not-allowed flex justify-center items-center gap-1.5 border border-stone-200"
          >
            <span className="text-sm font-bold">Tạm hết hàng</span>
          </button>
        ) : (
          <>
            <button
              onClick={onAddDirectly}
              disabled={isAnimating}
              className={`flex-1 py-2.5 px-2 rounded-2xl transition-all duration-300 flex justify-center items-center gap-1.5 ${
                isAnimating
                  ? 'bg-emerald-500 text-white scale-95 shadow-inner'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95'
              }`}
            >
              {isAnimating ? (
                <Check className="w-5 h-5 animate-in zoom-in spin-in-12 duration-300" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="text-sm font-bold transition-all duration-300">
                {isAnimating ? 'Đã thêm' : 'Thêm'}
              </span>
            </button>
            
            {item.hasCustomizations !== false && (
              <button
                onClick={onOpenModal}
                className="flex-1 py-2.5 px-2 rounded-2xl transition-all duration-300 flex justify-center items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
              >
                <span className="text-sm font-bold">Tùy chọn</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CustomizationModal: React.FC<{ item: MenuItem; onClose: () => void; onAdd: (item: CartItem) => void }> = ({ item, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState<typeof TOPPINGS>([]);
  const [temperature, setTemperature] = useState('Đá');
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [iceLevel, setIceLevel] = useState('100%');
  const [note, setNote] = useState('');

  const toggleTopping = (topping: typeof TOPPINGS[0]) => {
    setSelectedToppings(prev => 
      prev.find(t => t.id === topping.id) 
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const unitPrice = item.price + selectedSize.price + selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAdd({
      ...item,
      cartItemId: Math.random().toString(36).substr(2, 9),
      quantity,
      size: selectedSize.name,
      toppings: selectedToppings.map(t => t.name),
      unitPrice,
      temperature,
      sugarLevel,
      iceLevel,
      note,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="font-bold text-stone-800 text-lg">Tùy chỉnh món</h2>
            <p className="text-sm text-stone-500 line-clamp-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-grow space-y-8 overscroll-contain">
          {/* Item Info */}
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-stone-800 text-xl flex-grow pr-4">{item.name}</h3>
            <p className="text-emerald-600 font-bold text-xl whitespace-nowrap">{item.price.toLocaleString('vi-VN')}đ</p>
          </div>

          {/* Size Selection */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3">Chọn Size</h4>
            <div className="space-y-2">
              {SIZES.map(size => (
                <label key={size.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="size" 
                      checked={selectedSize.id === size.id} 
                      onChange={() => setSelectedSize(size)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-stone-700">{size.name}</span>
                  </div>
                  <span className="text-stone-500 text-sm">{size.price > 0 ? `+${size.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toppings Selection */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3">Thêm Topping</h4>
            <div className="space-y-2">
              {TOPPINGS.map(topping => {
                const isSelected = selectedToppings.some(t => t.id === topping.id);
                return (
                  <label key={topping.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleTopping(topping)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="font-medium text-stone-700">{topping.name}</span>
                    </div>
                    <span className="text-stone-500 text-sm">+{topping.price.toLocaleString('vi-VN')}đ</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3">Nhiệt độ</h4>
            <div className="flex gap-2">
              {['Nóng', 'Đá', 'Đá riêng'].map(temp => (
                <button
                  key={temp}
                  onClick={() => setTemperature(temp)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    temperature === temp
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Sugar Level */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3">Lượng đường</h4>
            <div className="flex flex-wrap gap-2">
              {['100%', '70%', '50%', '30%', '0%', 'Đường kiêng'].map(level => (
                <button
                  key={level}
                  onClick={() => setSugarLevel(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    sugarLevel === level
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Ice Level */}
          {temperature === 'Đá' && (
            <div>
              <h4 className="font-semibold text-stone-800 mb-3">Lượng đá</h4>
              <div className="flex flex-wrap gap-2">
                {['100%', '70%', '50%', '30%', '0%'].map(level => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      iceLevel === level
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3">Ghi chú thêm</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít ngọt, không lấy ống hút..."
              className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between py-2">
            <h4 className="font-semibold text-stone-800">Số lượng</h4>
            <div className="flex items-center bg-stone-100 rounded-lg p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-stone-600 hover:text-stone-900"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-10 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-stone-600 hover:text-stone-900"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-white sticky bottom-0 rounded-b-2xl sm:rounded-b-2xl">
          <button
            onClick={handleAdd}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-between px-6"
          >
            <span>Thêm vào giỏ</span>
            <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
