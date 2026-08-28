import React from 'react';

interface ResponsiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveGuideModal: React.FC<ResponsiveGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-100">📸 Hướng dẫn chụp ảnh Responsive (v0.1)</h2>
          <button className="text-slate-400 hover:text-slate-100 text-2xl leading-none" onClick={onClose} aria-label="Đóng cửa sổ hướng dẫn">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Để đạt tiêu chuẩn bàn giao cuối ngày (Deliverables), hãy làm theo các bước chuẩn dưới đây bằng Google Chrome / Edge DevTools:
          </p>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-400 mb-2 text-xs uppercase tracking-wide">Bước 1: Mở Chrome Device Mode</h4>
            <ul className="list-disc list-inside flex flex-col gap-1 text-slate-300">
              <li>Nhấn phím <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">F12</kbd> hoặc <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Ctrl + Shift + I</kbd>.</li>
              <li>Bấm biểu tượng 📱 <strong>Toggle Device Toolbar</strong> (<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Ctrl + Shift + M</kbd>).</li>
            </ul>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-400 mb-2 text-xs uppercase tracking-wide">Bước 2: Chọn kích thước Viewport nghiệm thu</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-100">📱 Mobile View:</strong><br />
                <span className="text-slate-400">375px × 812px</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-100">📱 Tablet View:</strong><br />
                <span className="text-slate-400">768px × 1024px</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-100">💻 Desktop View:</strong><br />
                <span className="text-slate-400">1280px × 800px+</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-cyan-400 mb-2 text-xs uppercase tracking-wide">Bước 3: Chụp Full Page Screenshot</h4>
            <ul className="list-disc list-inside flex flex-col gap-1 text-slate-300">
              <li>Nhấn <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Ctrl + Shift + P</kbd> trong DevTools.</li>
              <li>Gõ từ khóa: <code className="bg-slate-800 px-1 text-slate-200 font-mono">Capture full size screenshot</code> và bấm Enter.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
