import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ShoppingBag, Calendar, ChevronRight, Package, CreditCard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

interface OrderHistoryItem {
  orderId: string;
  customerName: string;
  timestamp: string;
  total: number;
  items: any[];
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [aiEmptyState, setAiEmptyState] = useState<{title: string, content: string, button: string, emoji: string} | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const emptyStates = [
    {
      title: "Chưa có ly nào!",
      content: "Lịch sử uống nước của bạn đang trống trơn. Barista đang buồn thiu vì chưa được phục vụ bạn đó!",
      button: "Đặt ly đầu tiên ngay",
      emoji: "🥤"
    },
    {
      title: "Ký ức trống rỗng...",
      content: "Bạn chưa có kỷ niệm nào với quán. Hãy tạo ra những ký ức ngọt ngào bằng một ly trà sữa full topping nhé!",
      button: "Tạo kỷ niệm ngay",
      emoji: "💭"
    },
    {
      title: "Thánh 'nhịn' uống?",
      content: "Sao bạn có thể chịu được cơn khát này hay vậy? Mau order một ly nước mát lạnh để giải tỏa đi nào!",
      button: "Giải khát ngay",
      emoji: "🌵"
    },
    {
      title: "Sổ nợ sạch trơn",
      content: "Chưa có hóa đơn nào được ghi lại. Bạn là khách hàng gương mẫu hay là chưa từng ghé quán vậy?",
      button: "Ghé quán online ngay",
      emoji: "📝"
    },
    {
      title: "Buồn so...",
      content: "Nhìn lịch sử trống trải mà lòng quán buồn so. Order một ly nước để tụi mình vui lên đi!",
      button: "Làm quán vui ngay",
      emoji: "😢"
    }
  ];

  const randomState = useMemo(() => {
    // 1. Get cached AI messages
    const cached = localStorage.getItem('ai_history_messages');
    const aiMessages = cached ? JSON.parse(cached) : [];
    
    // 2. Combine with static messages
    const allMessages = [...emptyStates, ...aiMessages];
    
    // 3. Pick one randomly
    return allMessages[Math.floor(Math.random() * allMessages.length)];
  }, [orders.length === 0]);

  const generateAIEmptyState = async () => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hãy tạo một nội dung thông báo lịch sử đơn hàng trống cho app đặt đồ uống (quán nước/trà sữa/cà phê) nội bộ. Phong cách: trẻ trung, lầy lội, GenZ, Thả thính & Drama, gần gũi, Ngắn gọn & Phũ. Tuyệt đối KHÔNG dùng từ liên quan đến đồ ăn, chỉ dùng từ liên quan đến đồ uống (pha chế, barista, khát, uống, ly, cốc, trà sữa, cà phê). Yêu cầu: Tiêu đề < 25 ký tự, Nội dung < 80 ký tự. Trả về JSON gồm: title, content, button (nút hành động ngắn), emoji (1 emoji phù hợp).",
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
        const cached = localStorage.getItem('ai_history_messages');
        const aiMessages = cached ? JSON.parse(cached) : [];
        // Keep last 10 messages
        const newCache = [result, ...aiMessages].slice(0, 10);
        localStorage.setItem('ai_history_messages', JSON.stringify(newCache));
      }
    } catch (e) {
      console.error('AI generation failed', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (orders.length === 0) {
      generateAIEmptyState();
    }
  }, [orders.length]);

  useEffect(() => {
    const savedOrders = localStorage.getItem('orderHistory');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (e) {
        console.error('Failed to parse order history', e);
      }
    }
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      if (timeRange === 'day') return orderDate.toDateString() === now.toDateString();
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (timeRange === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      if (timeRange === 'year') return orderDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [orders, timeRange]);

  if (orders.length === 0) {
    const displayState = randomState;
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-stone-50 rounded-[32px] flex items-center justify-center text-5xl">
            {displayState.emoji}
          </div>
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
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-stone-400 font-black text-xs uppercase tracking-widest">Lịch sử đơn hàng</h2>
        <span className="text-stone-400 font-bold text-xs">{filteredOrders.length} đơn hàng</span>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'day', label: 'Hôm nay' },
          { id: 'week', label: 'Tuần này' },
          { id: 'month', label: 'Tháng này' },
          { id: 'year', label: 'Năm nay' },
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as any)}
            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all tap-active ${
              timeRange === range.id
                ? 'bg-stone-900 text-white shadow-lg shadow-stone-200'
                : 'bg-white text-stone-400 border border-stone-100'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-stone-200">
              <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 font-bold">Không có đơn hàng trong thời gian này</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                layout
                key={order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 space-y-5"
              >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">#{order.orderId}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.orderStatus === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
                      order.orderStatus === 'Đã hủy' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {order.orderStatus || 'Đã nhận'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-800">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <h3 className="font-bold text-lg">{order.customerName}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-black text-xl">{order.total.toLocaleString()}đ</p>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 justify-end font-bold uppercase tracking-tighter">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.timestamp).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              
              <div className="bg-stone-50 rounded-2xl p-4 space-y-3 border border-stone-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-emerald-600 border border-stone-100">
                        {item.quantity}
                      </div>
                      <span className="font-bold text-stone-700">{item.name}</span>
                    </div>
                    <span className="text-stone-400 font-bold text-xs uppercase">{item.size}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Package className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{order.paymentStatus || 'Chưa trả'}</span>
                  </div>
                </div>
                <button className="w-8 h-8 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 tap-active">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )))}
        </AnimatePresence>
      </div>
    </div>
  );
}
