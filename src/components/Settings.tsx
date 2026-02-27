import { useState } from 'react';
import { Save, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

interface SettingsProps {
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
}

export function Settings({ appsScriptUrl, setAppsScriptUrl }: SettingsProps) {
  const [url, setUrl] = useState(appsScriptUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = () => {
    setAppsScriptUrl(url);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var itemsStr = data.items.map(function(item) {
      var details = [item.size];
      if (item.toppings && item.toppings.length > 0) {
        details = details.concat(item.toppings);
      }
      return item.name + " (x" + item.quantity + ") [" + details.join(", ") + "]";
    }).join("\\n");
    
    sheet.appendRow([
      data.timestamp,
      data.orderId,
      data.customerName,
      data.tableNumber,
      itemsStr,
      data.total,
      data.notes || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
        <h2 className="font-bold text-stone-800 text-lg mb-4">Cấu hình Google Sheets</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
            />
          </div>
          
          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Đã lưu thành công
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
        <h2 className="font-bold text-stone-800 text-lg mb-4">Hướng dẫn thiết lập</h2>
        
        <ol className="list-decimal list-inside space-y-4 text-stone-600 text-sm leading-relaxed">
          <li>
            Tạo một file <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-1">Google Sheets mới <ExternalLink className="w-3 h-3" /></a>.
          </li>
          <li>
            Tạo các cột ở hàng đầu tiên: <strong>Thời gian, Mã đơn, Tên khách, Số bàn, Món ăn, Tổng tiền, Ghi chú</strong>.
          </li>
          <li>
            Trên menu, chọn <strong>Tiện ích mở rộng</strong> {'>'} <strong>Apps Script</strong>.
          </li>
          <li>
            Xóa mã cũ và dán đoạn mã dưới đây vào:
            
            <div className="mt-3 relative">
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-normal">
                {appsScriptCode}
              </pre>
              <button
                onClick={copyCode}
                className="absolute top-2 right-2 bg-stone-700 hover:bg-stone-600 text-white p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              >
                {isCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {isCopied ? 'Đã copy' : 'Copy mã'}
              </button>
            </div>
          </li>
          <li>
            Nhấn <strong>Lưu</strong> (Ctrl+S).
          </li>
          <li>
            Nhấn <strong>Triển khai</strong> (Deploy) {'>'} <strong>Tùy chọn triển khai mới</strong> (New deployment).
          </li>
          <li>
            Chọn loại <strong>Ứng dụng web</strong> (Web app).
          </li>
          <li>
            Phần "Quyền truy cập" (Who has access), chọn <strong>Bất kỳ ai</strong> (Anyone).
          </li>
          <li>
            Nhấn <strong>Triển khai</strong>, cấp quyền truy cập nếu được hỏi.
          </li>
          <li>
            Copy <strong>URL ứng dụng web</strong> và dán vào ô cấu hình ở trên.
          </li>
        </ol>
      </div>
    </div>
  );
}
