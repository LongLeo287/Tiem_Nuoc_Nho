import { useState, useEffect } from 'react';
import { Save, CheckCircle2, Store, Printer, Volume2, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
}

export function Settings({ appsScriptUrl, setAppsScriptUrl }: SettingsProps) {
  // Initial values for dirty checking
  const [initialSettings, setInitialSettings] = useState({
    storeName: localStorage.getItem('storeName') || 'Tiệm Nước Nhỏ',
    storeAddress: localStorage.getItem('storeAddress') || '123 Đường ABC, TP.HCM',
    wifiPass: localStorage.getItem('wifiPass') || '12345678',
    printerIp: localStorage.getItem('printerIp') || '192.168.1.200',
    autoPrint: localStorage.getItem('autoPrint') === 'true',
    isMuted: localStorage.getItem('notificationMuted') === 'true',
  });

  // Store Settings
  const [storeName, setStoreName] = useState(initialSettings.storeName);
  const [storeAddress, setStoreAddress] = useState(initialSettings.storeAddress);
  const [wifiPass, setWifiPass] = useState(initialSettings.wifiPass);

  // Printer Settings
  const [printerIp, setPrinterIp] = useState(initialSettings.printerIp);
  const [autoPrint, setAutoPrint] = useState(initialSettings.autoPrint);

  // Sound Settings
  const [isMuted, setIsMuted] = useState(initialSettings.isMuted);

  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      storeName !== initialSettings.storeName ||
      storeAddress !== initialSettings.storeAddress ||
      wifiPass !== initialSettings.wifiPass ||
      printerIp !== initialSettings.printerIp ||
      autoPrint !== initialSettings.autoPrint ||
      isMuted !== initialSettings.isMuted;
    
    setHasChanges(changed);
  }, [storeName, storeAddress, wifiPass, printerIp, autoPrint, isMuted, initialSettings]);

  const handleSave = () => {
    localStorage.setItem('storeName', storeName);
    localStorage.setItem('storeAddress', storeAddress);
    localStorage.setItem('wifiPass', wifiPass);
    localStorage.setItem('printerIp', printerIp);
    localStorage.setItem('autoPrint', String(autoPrint));
    localStorage.setItem('notificationMuted', String(isMuted));

    // Update initial settings to match current saved state
    setInitialSettings({
      storeName,
      storeAddress,
      wifiPass,
      printerIp,
      autoPrint,
      isMuted,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 p-5 space-y-5">
      
      {/* Store Info Section */}
      <section className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[14px] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg leading-none">Thông tin cửa hàng</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Store Info</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tên quán</label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="input-field font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Địa chỉ</label>
            <input 
              type="text" 
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="input-field font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Mật khẩu Wifi</label>
            <div className="relative">
                <Wifi className="absolute left-4 top-3.5 w-4 h-4 text-stone-400" />
                <input 
                type="text" 
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="input-field font-bold pl-10"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Printer Settings */}
      <section className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-[14px] flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg leading-none">Máy in & Hóa đơn</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Printer Settings</p>
          </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                    <Printer className="w-4 h-4 text-stone-400" />
                    <span className="font-bold text-stone-700 text-sm">Tự động in hóa đơn</span>
                </div>
                <button 
                    onClick={() => setAutoPrint(!autoPrint)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${autoPrint ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${autoPrint ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">IP Máy in LAN</label>
                <input 
                type="text" 
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                placeholder="192.168.1.xxx"
                className="input-field font-mono text-sm font-bold"
                />
            </div>
        </div>
      </section>

      {/* Sound Settings */}
      <section className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-[14px] flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 text-lg leading-none">Âm thanh</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Sound Settings</p>
          </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-stone-400" />
                    <span className="font-bold text-stone-700 text-sm">Âm thanh thông báo</span>
                </div>
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${!isMuted ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${!isMuted ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
        </div>
      </section>

      {/* Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-24 z-10"
          >
            <button
              onClick={handleSave}
              className="btn-primary w-full flex items-center justify-center gap-2 shadow-xl shadow-stone-200"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Version */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Tiệm Nước Nhỏ App</p>
        <p className="text-[10px] font-bold text-stone-300">Version 1.3.0 • Build 2024</p>
      </div>

    </div>
  );
}
