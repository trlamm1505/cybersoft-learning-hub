import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'catalog' | 'detail';
  onNavigate: (tab: 'catalog' | 'detail', lessonId?: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  isLightTheme,
  onToggleTheme,
  onOpenGuide
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        {/* Brand Logo */}
        <a
          href="#catalog"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('catalog');
          }}
          className="brand-logo"
          aria-label="Trang chủ CyberSoft Learning Hub"
        >
          <div className="logo-badge">⚡</div>
          <div>
            <span>CyberSoft</span>
            <span style={{ color: 'var(--secondary)', marginLeft: '4px' }}>Hub</span>
            <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', textTransform: 'uppercase' }}>
              v0.1
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav role="navigation" aria-label="Thanh điều hướng chính">
          <ul className="nav-menu">
            <li>
              <a
                href="#catalog"
                className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('catalog');
                }}
              >
                📚 Danh mục khóa học
              </a>
            </li>
            <li>
              <a
                href="#detail"
                className={`nav-link ${activeTab === 'detail' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('detail');
                }}
              >
                📖 Chi tiết bài học
              </a>
            </li>
          </ul>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <button
            onClick={onOpenGuide}
            className="btn btn-secondary btn-sm"
            aria-label="Mở hướng dẫn chụp ảnh responsive"
            title="Hướng dẫn nghiệm thu Responsive"
          >
            📸 HD Responsive
          </button>

          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            aria-label={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            title="Thay đổi Theme Light/Dark"
          >
            {isLightTheme ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Mobile Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="mobile-drawer" aria-label="Menu di động">
          <a
            href="#catalog"
            className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('catalog');
              setMobileMenuOpen(false);
            }}
          >
            📚 Danh mục khóa học
          </a>
          <a
            href="#detail"
            className={`nav-link ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('detail');
              setMobileMenuOpen(false);
            }}
          >
            📖 Chi tiết bài học
          </a>
        </nav>
      )}
    </header>
  );
};
