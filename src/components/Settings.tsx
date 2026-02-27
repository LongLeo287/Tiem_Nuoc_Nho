import { useState } from 'react';
import { Save, CheckCircle2, Store, Printer, Wifi, Database, Trash2, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
}

export function Settings({ appsScriptUrl, setAppsScriptUrl }: SettingsProps) {
  // Store Settings
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || 'Tiệm Nước Nhỏ');
  const [storeAddress, setStoreAddress] = useState(() => localStorage.getItem('storeAddress') || '123 Đường ABC, TP.HCM');
  const [wifiPass, setWifiPass] = useState(() => localStorage.getItem('wifiPass') || '12345678');

  // Printer Settings
  const [printerIp, setPrinterIp] = useState(() => localStorage.getItem('printerIp') || '192.168.1.200');
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('autoPrint') === 'true');

  // Sound Settings
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('notificationVolume') || 80));
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notificationMuted') === 'true');

  // System Settings
  const [url, setUrl] = useState(appsScriptUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = () => {
    localStorage.setItem('storeName', storeName);
    localStorage.setItem('storeAddress', storeAddress);
    localStorage.setItem('wifiPass', wifiPass);
    localStorage.setItem('printerIp', printerIp);
    localStorage.setItem('autoPrint', String(autoPrint));
    localStorage.setItem('notificationVolume', String(volume));
    localStorage.setItem('notificationMuted', String(isMuted));
    
    if (url !== appsScriptUrl) {
      setAppsScriptUrl(url);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const clearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa dữ liệu tạm? (Menu, Lịch sử đơn hàng)')) {
        localStorage.removeItem('menu_items');
        localStorage.removeItem('staff_orders');
        localStorage.removeItem('order_history');
        alert('Đã xóa dữ liệu tạm thành công!');
        window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 p-6 space-y-6">
      
      {/* Store Info Section */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg">Thông tin cửa hàng</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Store Info</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tên quán</label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-50 border-none font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Địa chỉ</label>
            <input 
              type="text" 
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-50 border-none font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Mật khẩu Wifi</label>
            <div className="relative">
                <Wifi className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input 
                type="text" 
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="w-full p-3 pl-10 rounded-xl bg-stone-50 border-none font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500/20"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Printer Section */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg">Máy in & Hóa đơn</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Printer Config</p>
          </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <span className="font-bold text-stone-700 text-sm">Tự động in hóa đơn</span>
                <button 
                    onClick={() => setAutoPrint(!autoPrint)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${autoPrint ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${autoPrint ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">IP Máy in LAN</label>
                <input 
                type="text" 
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                placeholder="192.168.1.xxx"
                className="w-full p-3 rounded-xl bg-stone-50 border-none font-mono text-sm font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500/20"
                />
            </div>
        </div>
      </section>

      {/* Sound Settings */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg">Âm thanh thông báo</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sound Config</p>
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <span className="font-bold text-stone-700 text-sm">Bật tiếng thông báo</span>
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${!isMuted ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${!isMuted ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
            
            {!isMuted && (
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-xs font-bold text-stone-500">
                  <span>Âm lượng</span>
                  <span>{volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
        </div>
      </section>

      {/* System & Data Section */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg">Dữ liệu hệ thống</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">System Data</p>
          </div>
        </div>

        <div className="space-y-3">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-stone-50 rounded-xl text-stone-600 font-bold text-sm"
            >
                <span>Cấu hình kết nối (Apps Script)</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <input 
                            type="url" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[10px] text-stone-600 focus:ring-2 focus:ring-emerald-500/20 mb-3"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                onClick={clearCache}
                className="w-full p-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                Xóa dữ liệu tạm & Làm mới
            </button>
        </div>
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-stone-900 text-white py-4 rounded-[24px] font-black text-lg shadow-xl shadow-stone-200 tap-active flex items-center justify-center gap-2 sticky bottom-24 z-10"
      >
        {isSaved ? (
            <>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Đã lưu cài đặt
            </>
        ) : (
            <>
            <Save className="w-5 h-5" />
            Lưu thay đổi
            </>
        )}
      </button>

      {/* App Version */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Tiệm Nước Nhỏ App</p>
        <p className="text-[10px] font-bold text-stone-300">Version 1.2.0 • Build 2024</p>
      </div>

    </div>
  );
}
