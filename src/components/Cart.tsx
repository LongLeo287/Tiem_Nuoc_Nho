import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Minus, ArrowRight, AlertCircle, Edit2, X, ShoppingBag, Clock, CheckCircle2, RefreshCw, ChevronRight, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
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
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản'>('Tiền mặt');
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

  const [aiEmptyState, setAiEmptyState] = useState<{title: string, content: string, button: string, emoji: string} | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const emptyStates = [
    {
      title: "Cốc của bạn đang buồn hiu...",
      content: "Chưa có giọt nước nào trong đơn cả. Đừng để cổ họng khô khốc, \"chốt đơn\" ngay ly trà sữa full topping đi!",
      button: "Uống ngay cho đã!",
      emoji: "🥺"
    },
    {
      title: "Sạch bóng ly cốc!",
      content: "Chưa thấy một dấu vết nào của sự giải khát ở đây cả. Bạn định nhịn uống để dành tiền lấy vợ/chồng à?",
      button: "Phung phí chút đi!",
      emoji: "💸"
    },
    {
      title: "Một sự trống trải...",
      content: "Lịch sử order của bạn còn sạch hơn cả ly nước lọc. Mau \"vấy bẩn\" nó bằng vài ly trà sữa béo ngậy đi!",
      button: "Lên đơn cho đỡ khát",
      emoji: "💅"
    },
    {
      title: "Tìm đỏ mắt không thấy đơn!",
      content: "Lục tung cái app này lên cũng không thấy bạn đã uống gì. Đừng để máy pha cà phê ngồi chơi xơi nước nữa bạn ơi!",
      button: "Tạo công ăn việc làm ngay",
      emoji: "👀"
    },
    {
      title: "Trống trơn!",
      content: "Nhìn gì mà nhìn? Chưa đặt ly nào thì lấy đâu ra lịch sử mà xem. Quay lại menu gấp!",
      button: "Đi đặt nước ngay đi!",
      emoji: "🙄"
    },
    {
      title: "Giỏ hàng đang 'khát'",
      content: "Giỏ hàng đang trống trải như ví tiền cuối tháng vậy. Chọn nước ngay thôi đồng chí ơi!",
      button: "Triển thôi!",
      emoji: "💀"
    },
    {
      title: "Barista đang đợi",
      content: "Đừng để Barista đợi chờ trong vô vọng, lên đơn ngay và luôn nào!",
      button: "Lên đơn!",
      emoji: "👨‍🍳"
    },
    {
      title: "Máy xay mốc meo rồi",
      content: "Máy xay đang mốc meo rồi, chọn đại một ly sinh tố cho vui cửa vui nhà đi!",
      button: "Cứu khát!",
      emoji: "🕸️"
    },
    {
      title: "Tính xem bói hả?",
      content: "Tính xem bói hay sao mà chưa chọn món nào thế? Quay lại thực đơn ngay!",
      button: "Xem menu!",
      emoji: "🔮"
    },
    {
      title: "Hông có gì giải nhiệt",
      content: "Hông chọn món là hông có gì giải nhiệt đâu nha. Quay lại menu thôi nè!",
      button: "Triển ngay!",
      emoji: "🫠"
    },
    {
      title: "Menu bao la",
      content: "Menu bao la mà chưa thấy món nào vào 'mắt xanh' của bạn sao? Thử lại xem!",
      button: "Thử lại!",
      emoji: "✨"
    },
    {
      title: "Đang đợi chốt đơn",
      content: "Tình trạng: Đang đợi chốt đơn. Đừng để tui đợi lâu, tui dỗi đó!",
      button: "Chốt đơn!",
      emoji: "😤"
    },
    {
      title: "Uống không khí hả?",
      content: "Ủa rồi có chọn món không hay định uống không khí? Quay lại menu gấp!",
      button: "Uống món ngon!",
      emoji: "🤡"
    },
    {
      title: "Trống như NYC",
      content: "Order trống trơn như người yêu cũ vậy. Quay lại tìm 'mối' mới trong menu đi!",
      button: "Tìm mối mới!",
      emoji: "💔"
    },
    {
      title: "Ảo thuật gia à?",
      content: "Định làm ảo thuật cho ly nước tự hiện ra à? Phải chọn thì mới có đơn chứ!",
      button: "Chọn món!",
      emoji: "🎩"
    }
  ];

  const randomState = useMemo(() => {
    // 1. Get cached AI messages
    const cached = localStorage.getItem('ai_generated_messages');
    const aiMessages = cached ? JSON.parse(cached) : [];
    
    // 2. Combine with static messages
    const allMessages = [...emptyStates, ...aiMessages];
    
    // 3. Pick one randomly
    return allMessages[Math.floor(Math.random() * allMessages.length)];
  }, [cart.length === 0]); // Only re-pick when cart becomes empty

  const generateAIEmptyState = async () => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      // Get menu data for context
      const menuData = localStorage.getItem('menu_data');
      let menuContext = "";
      if (menuData) {
        try {
          const items = JSON.parse(menuData);
          const available = items.filter((i: any) => !i.isOutOfStock).map((i: any) => i.name);
          // Pick 3 random items
          const randomItems = available.sort(() => 0.5 - Math.random()).slice(0, 3);
          if (randomItems.length > 0) {
            menuContext = `Hãy nhắc đến các món này trong nội dung để dụ dỗ khách hàng: ${randomItems.join(', ')}.`;
          }
        } catch (e) {
          console.error("Error parsing menu data for AI context", e);
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Hãy tạo một nội dung thông báo giỏ hàng trống cho app đặt đồ uống (quán nước/trà sữa/cà phê) nội bộ. 
        Phong cách: trẻ trung, lầy lội, GenZ, Thả thính & Drama, gần gũi, Hệ thống đang vã đơn, Ngắn gọn & Phũ. 
        ${menuContext}
        Tuyệt đối KHÔNG dùng từ liên quan đến đồ ăn (nấu, bếp, đói, ăn), chỉ dùng từ liên quan đến đồ uống (pha chế, barista, khát, uống, ly, cốc, trà sữa, cà phê). 
        Yêu cầu: Tiêu đề < 25 ký tự, Nội dung < 80 ký tự. 
        Trả về JSON gồm: title, content, button (nút hành động ngắn), emoji (1 emoji phù hợp).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              button: { type: Type.STRING },
              emoji: { type: Type.STRING }
            },
            required: ["title", "content", "button", "emoji"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.title && result.content && result.button) {
        // Save to cache for NEXT time
        const cached = localStorage.getItem('ai_generated_messages');
        const aiMessages = cached ? JSON.parse(cached) : [];
        
        // Check for duplicates in recent history
        const isDuplicate = aiMessages.some((msg: any) => msg.title === result.title || msg.content === result.content);
        
        if (!isDuplicate) {
           // Keep last 15 messages for more variety
          const newCache = [result, ...aiMessages].slice(0, 15);
          localStorage.setItem('ai_generated_messages', JSON.stringify(newCache));
        }
      }
    } catch (e) {
      console.error('AI generation failed', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (cart.length === 0) {
      generateAIEmptyState();
    }
  }, [cart.length]);

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  useEffect(() => {
    let interval: any;
    if (submittedOrder && appsScriptUrl) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${appsScriptUrl}?action=getOrderStatus&orderId=${submittedOrder.orderId}`);
          const data = await response.json();
          if (data && data.orderStatus && data.orderStatus !== submittedOrder.orderStatus) {
            const updatedOrder = { ...submittedOrder, orderStatus: data.orderStatus, paymentStatus: data.paymentStatus || submittedOrder.paymentStatus };
            setSubmittedOrder(updatedOrder);
            localStorage.setItem('submittedOrder', JSON.stringify(updatedOrder));
            
            const savedHistory = localStorage.getItem('orderHistory');
            if (savedHistory) {
              const history = JSON.parse(savedHistory).map((o: any) => 
                o.orderId === submittedOrder.orderId ? updatedOrder : o
              );
              localStorage.setItem('orderHistory', JSON.stringify(history));
            }
          }
        } catch (e) {
          console.error('Failed to poll order status', e);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [submittedOrder, appsScriptUrl]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appsScriptUrl) {
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
      paymentMethod,
      orderStatus: 'Đã nhận',
      paymentStatus: paymentMethod === 'Tiền mặt' ? 'Chưa thanh toán' : 'Đã thanh toán',
    };

    try {
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
      } catch (e) {}

      if (result && result.status === 'error') {
        throw new Error(result.message || 'Có lỗi xảy ra từ máy chủ.');
      }

      setSubmitStatus('success');
      setSubmittedOrder(orderData);
      localStorage.setItem('submittedOrder', JSON.stringify(orderData));
      
      const savedHistory = localStorage.getItem('orderHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      history.push(orderData);
      localStorage.setItem('orderHistory', JSON.stringify(history));

      clearCart();
      setCustomerName('');
      setTableNumber('');
      setNotes('');
    } catch (error: any) {
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
        const savedHistory = localStorage.getItem('orderHistory');
        if (savedHistory) {
          const history = JSON.parse(savedHistory).filter((o: any) => o.orderId !== submittedOrder.orderId);
          localStorage.setItem('orderHistory', JSON.stringify(history));
        }

        setSubmittedOrder(null);
        localStorage.removeItem('submittedOrder');
        setSubmitStatus('idle');
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
      await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancelOrder', orderId: submittedOrder.orderId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      restoreCart(submittedOrder.items);

      const savedHistory = localStorage.getItem('orderHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory).filter((o: any) => o.orderId !== submittedOrder.orderId);
        localStorage.setItem('orderHistory', JSON.stringify(history));
      }

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
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        
        <h2 className="text-3xl font-black text-stone-800 mb-2">Đặt hàng thành công!</h2>
        <p className="text-stone-500 mb-8">Mã đơn: <span className="text-stone-800 font-bold">{submittedOrder.orderId}</span></p>

        <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 text-left space-y-4 mb-8">
          <div className="flex justify-between items-center pb-4 border-b border-stone-50">
            <span className="text-stone-400 font-bold text-xs uppercase tracking-widest">Trạng thái</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              submittedOrder.orderStatus === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
              submittedOrder.orderStatus === 'Đã hủy' ? 'bg-red-50 text-red-600' :
              'bg-amber-50 text-amber-600'
            }`}>
              {submittedOrder.orderStatus}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Khách hàng</span>
              <span className="font-bold text-stone-800">{submittedOrder.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Thanh toán</span>
              <span className="font-bold text-stone-800">{submittedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Tổng tiền</span>
              <span className="font-black text-emerald-600 text-lg">{submittedOrder.total.toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleEditOrder}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl tap-active flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Sửa đơn
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-2xl tap-active flex items-center justify-center gap-2"
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
            className="w-full py-5 bg-stone-900 text-white font-black rounded-2xl tap-active shadow-xl shadow-stone-200"
          >
            Đặt đơn mới
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    // Use randomState which now includes cached AI messages
    const displayState = randomState;
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-stone-50 rounded-[32px] flex items-center justify-center text-5xl">
            {displayState.emoji}
          </div>
          {/* Hidden AI generation indicator */}
        </div>
        <h2 className="text-2xl font-black text-stone-800 mb-3">{displayState.title}</h2>
        <p className="text-stone-500 mb-10 leading-relaxed">
          {displayState.content}
        </p>
        <div className="w-full">
          <button
            onClick={() => window.location.hash = '#/'}
            className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl tap-active shadow-xl shadow-emerald-100"
          >
            {displayState.button}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-32">
      <div className="p-5 space-y-8">
        {/* Cart Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-stone-400 font-black text-xs uppercase tracking-widest">Món đã chọn ({cart.length})</h2>
            <button onClick={() => setShowClearConfirm(true)} className="text-red-500 font-bold text-xs tap-active bg-red-50 px-3 py-1.5 rounded-lg">Xóa tất cả</button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  layout
                  key={item.cartItemId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card p-5 border border-stone-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-grow pr-4">
                      <h3 className="font-bold text-stone-800 text-lg truncate leading-tight mb-1">{item.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wide border border-stone-100">
                          {item.temperature}
                        </span>
                        {item.iceLevel && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wide border border-stone-100">
                            {item.iceLevel} đá
                          </span>
                        )}
                        {item.sugarLevel && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wide border border-stone-100">
                            {item.sugarLevel} đường
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-emerald-600 font-black text-lg whitespace-nowrap">
                      {(item.unitPrice * item.quantity).toLocaleString()}đ
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-stone-50 mt-2">
                    <div className="flex items-center bg-stone-50 rounded-[14px] p-1 border border-stone-100">
                      <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 tap-active bg-white rounded-[10px] shadow-sm"><Minus className="w-4 h-4" /></button>
                      <span className="w-10 text-center font-black text-sm text-stone-800">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 tap-active bg-white rounded-[10px] shadow-sm"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingItem(item)} className="w-9 h-9 flex items-center justify-center bg-stone-50 text-stone-400 rounded-[14px] tap-active border border-stone-100 hover:bg-stone-100 hover:text-stone-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => updateQuantity(item.cartItemId, -item.quantity)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-400 rounded-[14px] tap-active border border-red-100 hover:bg-red-100 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Order Form */}
        <section className="card p-6 border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[14px] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-stone-800 text-lg">Thông tin nhận món</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Delivery Info</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Tên của bạn</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nhập tên..."
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Số bàn (Tùy chọn)</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ví dụ: 05"
                className="input-field"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                {['Tiền mặt', 'Chuyển khoản'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`py-4 rounded-[18px] font-bold text-sm border transition-all tap-active relative overflow-hidden ${
                      paymentMethod === method 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'border-stone-100 bg-stone-50 text-stone-400'
                    }`}
                  >
                    {method}
                    {paymentMethod === method && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Ít đá, nhiều sữa..."
                className="input-field resize-none min-h-[80px]"
                rows={2}
              />
            </div>
          </div>
        </section>

        {submitStatus === 'error' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-[20px] flex items-center gap-3 border border-red-100 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Sticky Footer Summary */}
      <div className="fixed bottom-20 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-stone-100/50 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Tổng thanh toán</p>
            <p className="text-2xl font-black text-emerald-600">{total.toLocaleString()}đ</p>
          </div>
          <div className="text-right">
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Số lượng</p>
            <p className="text-stone-800 font-bold">{cart.length} món</p>
          </div>
        </div>
        <button
          onClick={handleOrder}
          disabled={isSubmitting || !customerName}
          className="w-full bg-stone-900 text-white py-4 rounded-[20px] font-black text-lg shadow-xl shadow-stone-200 tap-active flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all hover:bg-stone-800"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Đang gửi đơn...
            </>
          ) : (
            <>
              Gửi đơn hàng
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-extrabold text-stone-800 mb-3">Xác nhận xóa?</h3>
              <p className="text-stone-500 mb-8 leading-relaxed">Bạn có chắc chắn muốn xóa tất cả món trong giỏ hàng không?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold text-stone-400 tap-active">Hủy</button>
                <button onClick={() => { clearCart(); setShowClearConfirm(false); }} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 tap-active shadow-lg shadow-red-100">Xóa hết</button>
              </div>
            </motion.div>
          </div>
        )}

        {editingItem && (
          <EditCartItemModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updated) => {
              updateCartItem(editingItem.cartItemId, updated);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditCartItemModal({ item, onClose, onSave }: { item: CartItem; onClose: () => void; onSave: (item: CartItem) => void }) {
  const [temperature, setTemperature] = useState(item.temperature || 'Đá');
  const [sugarLevel, setSugarLevel] = useState(item.sugarLevel || 'Bình thường');
  const [iceLevel, setIceLevel] = useState(item.iceLevel || 'Bình thường');
  const [note, setNote] = useState(item.note || '');

  const unitPrice = item.price;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-[60]">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white rounded-t-[40px] w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 flex justify-between items-center border-b border-stone-50">
          <h2 className="text-2xl font-black text-stone-800">Chỉnh sửa món</h2>
          <button onClick={onClose} className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 tap-active">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto px-8 py-6 space-y-10 scrollbar-hide">
          <div className="grid grid-cols-1 gap-8">
            <section>
              <h4 className="text-stone-400 font-black text-xs uppercase tracking-widest mb-4">Nhiệt độ</h4>
              <div className="flex gap-2">
                {['Nóng', 'Đá', 'Đá riêng'].map(temp => (
                  <button
                    key={temp}
                    onClick={() => setTemperature(temp)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all tap-active ${
                      temperature === temp ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-100 text-stone-400'
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </section>

            {(temperature === 'Đá') && (
              <section>
                <h4 className="text-stone-400 font-black text-xs uppercase tracking-widest mb-4">Lượng đá</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['Ít', 'Vừa', 'Bình thường'].map(level => (
                    <button
                      key={level}
                      onClick={() => setIceLevel(level)}
                      className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-all tap-active ${
                        iceLevel === level ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-100 text-stone-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-stone-400 font-black text-xs uppercase tracking-widest mb-4">Lượng đường</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Ít ngọt', 'Vừa', 'Bình thường', 'Ngọt', 'Đường kiêng'].map(level => (
                  <button
                    key={level}
                    onClick={() => setSugarLevel(level === 'Đường kiêng' ? '1 gói đường kiêng' : level)}
                    className={`py-2.5 rounded-xl font-bold text-xs border-2 transition-all tap-active ${
                      (level === 'Đường kiêng' ? sugarLevel === '1 gói đường kiêng' : sugarLevel === level)
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                        : 'border-stone-100 text-stone-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h4 className="text-stone-400 font-black text-xs uppercase tracking-widest mb-4">Ghi chú</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field p-5 rounded-[24px] resize-none text-sm font-medium"
              rows={2}
            />
          </section>
        </div>

        <div className="p-8 bg-white border-t border-stone-50">
          <button
            onClick={() => onSave({
              ...item,
              unitPrice,
              temperature,
              sugarLevel,
              iceLevel: temperature === 'Đá' ? iceLevel : (temperature === 'Đá riêng' ? 'Bình thường' : undefined),
              note,
            })}
            className="btn-primary"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
