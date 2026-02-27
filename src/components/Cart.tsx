import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, AlertCircle, Edit2, X, ShoppingBag } from 'lucide-react';
import { CartItem, OrderData } from '../types';
import { SIZES, TOPPINGS } from './Menu';

interface CartProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  updateCartItem: (id: string, updatedItem: CartItem) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  appsScriptUrl: string;
  onNavigateSettings: () => void;
}

export function Cart({ cart, updateQuantity, updateCartItem, clearCart, restoreCart, appsScriptUrl, onNavigateSettings }: CartProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<OrderData | null>(() => {
    const saved = localStorage.getItem('submittedOrder');
    return saved ? JSON.parse(saved) : null;
  });

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appsScriptUrl) {
      alert('Vui lòng cấu hình Google Apps Script URL trong phần Cài đặt trước khi đặt hàng.');
      onNavigateSettings();
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const orderData: OrderData = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      customerName,
      tableNumber,
      items: cart,
      total,
      timestamp: new Date().toISOString(),
      notes,
    };

    try {
      // Using text/plain to avoid CORS preflight issues with Google Apps Script
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'createOrder', ...orderData }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        // Response might be opaque or not JSON
      }

      if (result && result.status === 'error') {
        throw new Error(result.message || 'Có lỗi xảy ra từ máy chủ.');
      }

      setSubmitStatus('success');
      setSubmittedOrder(orderData);
      localStorage.setItem('submittedOrder', JSON.stringify(orderData));
      clearCart();
      setCustomerName('');
      setTableNumber('');
      setNotes('');
    } catch (error: any) {
      console.error('Order error:', error);
      setErrorMessage(error.message || 'Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!submittedOrder) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancelOrder', orderId: submittedOrder.orderId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSubmittedOrder(null);
        localStorage.removeItem('submittedOrder');
        setSubmitStatus('idle');
        alert('Đã hủy đơn hàng thành công!');
      } else {
        throw new Error(data.message || 'Lỗi khi hủy đơn');
      }
    } catch (err) {
      alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOrder = async () => {
    if (!submittedOrder) return;
    setIsSubmitting(true);
    try {
      // First cancel the order on the server
      await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancelOrder', orderId: submittedOrder.orderId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      // Restore items to cart
      restoreCart(submittedOrder.items);
      setCustomerName(submittedOrder.customerName);
      setTableNumber(submittedOrder.tableNumber || '');
      setNotes(submittedOrder.notes || '');
      setSubmittedOrder(null);
      localStorage.removeItem('submittedOrder');
      setSubmitStatus('idle');
    } catch (err) {
      alert('Không thể chỉnh sửa lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrder) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-[24px] shadow-sm border border-stone-100 p-6 text-center space-y-6 max-w-md mx-auto mt-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">Đặt hàng thành công!</h2>
            <p className="text-stone-500">Mã đơn: <strong className="text-stone-800">{submittedOrder.orderId}</strong></p>
          </div>
          
          <div className="bg-stone-50 rounded-2xl p-5 text-left space-y-3">
            <p className="text-sm text-stone-600 flex justify-between">
              <span>Khách hàng:</span>
              <strong className="text-stone-800">{submittedOrder.customerName}</strong>
            </p>
            <p className="text-sm text-stone-600 flex justify-between">
              <span>Tổng tiền:</span>
              <strong className="text-emerald-600 text-base">{submittedOrder.total.toLocaleString('vi-VN')}đ</strong>
            </p>
            <p className="text-sm text-stone-600 flex justify-between">
              <span>Thời gian:</span>
              <span className="text-stone-800">{new Date(submittedOrder.timestamp).toLocaleTimeString('vi-VN')}</span>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEditOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Sửa đơn
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Hủy đơn
            </button>
          </div>
          
          <button
            onClick={() => {
              setSubmittedOrder(null);
              localStorage.removeItem('submittedOrder');
              setSubmitStatus('idle');
            }}
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl font-bold text-white bg-stone-800 hover:bg-stone-900 transition-colors disabled:opacity-50"
          >
            Đặt đơn mới
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && submitStatus !== 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-stone-500">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-stone-300" />
        </div>
        <p className="text-lg font-medium text-stone-600">Giỏ hàng trống</p>
        <p className="text-sm mt-1">Hãy chọn món từ thực đơn nhé!</p>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Đặt hàng thành công!</h2>
        <p className="text-stone-600 mb-8">
          Cảm ơn bạn. Đơn hàng của bạn đã được ghi nhận và đang được chuẩn bị.
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-emerald-700 transition-colors"
        >
          Đặt đơn mới
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-28">
      {!appsScriptUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Chưa cấu hình Google Sheets</p>
            <p className="text-xs mt-1 opacity-90">
              Bạn cần thiết lập URL Apps Script để lưu đơn hàng.
            </p>
            <button
              onClick={onNavigateSettings}
              className="text-xs font-bold underline mt-2 hover:text-amber-900"
            >
              Đi tới Cài đặt
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[24px] shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h2 className="font-bold text-stone-800 text-lg">Món đã chọn</h2>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {cart.map((item, index) => (
            <div key={item.cartItemId} className="p-5 flex items-start gap-4">
              <span className="font-bold text-stone-400 w-4 pt-0.5">{index + 1}.</span>
              <div className="flex-grow">
                <h3 className="font-bold text-stone-800 text-base">{item.name}</h3>
                <div className="text-sm text-stone-500 mt-1 mb-2 leading-relaxed">
                  {item.size}
                  {item.toppings.length > 0 && ` • ${item.toppings.join(', ')}`}
                  {item.temperature && ` • ${item.temperature}`}
                  {item.sugarLevel && ` • Đường: ${item.sugarLevel}`}
                  {item.iceLevel && item.temperature !== 'Nóng' && ` • Đá: ${item.iceLevel}`}
                  {item.note && (
                    <div className="mt-1 text-amber-600 italic">
                      Ghi chú: {item.note}
                    </div>
                  )}
                </div>
                <p className="text-emerald-600 font-extrabold">
                  {item.unitPrice.toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                {item.hasCustomizations !== false && (
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-stone-500 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                    title="Sửa tùy chọn"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Sửa</span>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center bg-stone-50 border border-stone-100 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-stone-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <span className="text-stone-600 font-bold text-lg">Tổng cộng</span>
          <span className="text-2xl font-black text-emerald-600">
            {total.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      <form id="order-form" onSubmit={handleOrder} className="bg-white rounded-[24px] shadow-sm border border-stone-100 p-6 space-y-5">
        <h2 className="font-bold text-stone-800 text-lg mb-2">Thông tin nhận món</h2>
        
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Tên khách hàng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nhập tên của bạn"
            className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:font-normal"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Số bàn (Tùy chọn)
          </label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Ví dụ: Bàn 05"
            className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:font-normal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Ghi chú (Tùy chọn)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Ít đá, nhiều sữa..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {submitStatus === 'error' && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {errorMessage}
          </div>
        )}
      </form>

      {/* Sticky Order Summary */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20 max-w-3xl mx-auto -mx-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-stone-600 font-medium">Tổng cộng ({cart.reduce((sum, item) => sum + item.quantity, 0)} món)</span>
          <span className="text-2xl font-bold text-emerald-600">
            {total.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <button
          type="submit"
          form="order-form"
          disabled={isSubmitting || !appsScriptUrl}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            <>
              Đặt hàng ngay
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Xác nhận xóa</h3>
            <p className="text-stone-600 mb-6">Bạn có chắc chắn muốn xóa tất cả món hàng trong giỏ không?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditCartItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updatedItem) => {
            updateCartItem(editingItem.cartItemId, updatedItem);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

const EditCartItemModal: React.FC<{
  item: CartItem;
  onClose: () => void;
  onSave: (item: CartItem) => void;
}> = ({ item, onClose, onSave }) => {
  const [selectedSize, setSelectedSize] = useState(SIZES.find(s => s.name === item.size) || SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState<typeof TOPPINGS>(
    TOPPINGS.filter(t => item.toppings.includes(t.name))
  );
  const [temperature, setTemperature] = useState(item.temperature || 'Đá');
  const [sugarLevel, setSugarLevel] = useState(item.sugarLevel || '100%');
  const [iceLevel, setIceLevel] = useState(item.iceLevel || '100%');
  const [note, setNote] = useState(item.note || '');

  const toggleTopping = (topping: typeof TOPPINGS[0]) => {
    setSelectedToppings(prev => 
      prev.find(t => t.id === topping.id) 
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const unitPrice = item.price + selectedSize.price + selectedToppings.reduce((sum, t) => sum + t.price, 0);

  const handleSave = () => {
    onSave({
      ...item,
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
            <h2 className="font-bold text-stone-800 text-lg">Sửa tùy chọn</h2>
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

          <div>
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Chọn Size
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {SIZES.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    selectedSize.id === size.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 hover:border-emerald-200 text-stone-600'
                  }`}
                >
                  <span className="font-bold">{size.id}</span>
                  <span className="text-xs opacity-80">
                    {size.price > 0 ? `+${size.price / 1000}k` : 'Miễn phí'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Thêm Topping
            </h4>
            <div className="space-y-2">
              {TOPPINGS.map((topping) => {
                const isSelected = selectedToppings.some(t => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex justify-between items-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-stone-200 hover:border-emerald-200'
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? 'text-emerald-700' : 'text-stone-700'}`}>
                      {topping.name}
                    </span>
                    <span className={`text-sm ${isSelected ? 'text-emerald-600 font-bold' : 'text-stone-500'}`}>
                      +{topping.price.toLocaleString('vi-VN')}đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Nhiệt độ
            </h4>
            <div className="flex gap-2">
              {['Nóng', 'Đá', 'Đá riêng'].map(temp => (
                <button
                  key={temp}
                  onClick={() => setTemperature(temp)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                    temperature === temp
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 hover:border-emerald-200 text-stone-600'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Sugar Level */}
          <div>
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
              Lượng đường
            </h4>
            <div className="flex flex-wrap gap-2">
              {['100%', '70%', '50%', '30%', '0%', 'Đường kiêng'].map(level => (
                <button
                  key={level}
                  onClick={() => setSugarLevel(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                    sugarLevel === level
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 hover:border-emerald-200 text-stone-600'
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
              <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
                Lượng đá
              </h4>
              <div className="flex flex-wrap gap-2">
                {['100%', '70%', '50%', '30%', '0%'].map(level => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                      iceLevel === level
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-stone-200 hover:border-emerald-200 text-stone-600'
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
            <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span>
              Ghi chú thêm
            </h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít ngọt, không lấy ống hút..."
              className="w-full p-3 rounded-xl border-2 border-stone-200 focus:outline-none focus:border-emerald-500 transition-all resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 bg-white sticky bottom-0 rounded-b-2xl">
          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-sm hover:bg-emerald-700 transition-colors flex justify-between items-center px-6"
          >
            <span>Lưu thay đổi</span>
            <span>{(unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
