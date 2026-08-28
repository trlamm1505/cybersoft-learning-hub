import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 items-center text-center">
        <div className="font-bold text-base text-slate-100 flex items-center gap-2">
          <span>⚡ CyberSoft Learning & Contest Hub</span>
          <span className="text-xs bg-indigo-900/60 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">FE Student UI v0.1</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
          Hệ thống đào tạo Lập trình Thực chiến CyberSoft Academy. Tối ưu giao diện trải nghiệm học viên với Tailwind CSS v4 trên cả máy tính và thiết bị di động.
        </p>
        <div className="text-[11px] text-slate-500 mt-2">
          © 2026 CyberSoft Academy. All rights reserved. Đạt chuẩn Accessibility (WCAG 2.1 AA).
        </div>
      </div>
    </footer>
  );
};
