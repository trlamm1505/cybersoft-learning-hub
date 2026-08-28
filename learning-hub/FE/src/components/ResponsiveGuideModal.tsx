import React from 'react';

interface ResponsiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveGuideModal: React.FC<ResponsiveGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title" style={{ fontSize: '1.25rem' }}>📸 Hướng dẫn chụp ảnh màn hình Responsive (v0.1)</h2>
          <button className="close-btn" onClick={onClose} aria-label="Đóng cửa sổ hướng dẫn">
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          <p>
            Để đạt tiêu chuẩn bàn giao cuối ngày (Deliverables), hãy làm theo các bước chuẩn dưới đây bằng Google Chrome / Edge DevTools:
          </p>

          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Bước 1: Mở Chrome Device Mode</h4>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Nhấn phím <kbd style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>F12</kbd> hoặc <kbd style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + Shift + I</kbd>.</li>
              <li>Bấm biểu tượng 📱 <strong>Toggle Device Toolbar</strong> (<kbd style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + Shift + M</kbd>).</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Bước 2: Chọn các kích thước Viewport nghiệm thu</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '6px' }}>
                <strong>📱 Mobile View:</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>iPhone 12 / 375px × 812px</span>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '6px' }}>
                <strong>📱 Tablet View:</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>iPad Air / 768px × 1024px</span>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '6px' }}>
                <strong>💻 Desktop View:</strong><br />
                <span style={{ color: 'var(--text-muted)' }}>1280px × 800px+</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Bước 3: Chụp Full Page Screenshot</h4>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Nhấn <kbd style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + Shift + P</kbd> trong DevTools.</li>
              <li>Gõ từ khóa: <code>Capture full size screenshot</code> và bấm Enter.</li>
              <li>Lưu các ảnh với tên file chuẩn: <code>01_catalog_mobile.png</code>, <code>02_lesson_detail_desktop.png</code>.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
