import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

/** Footer nhẹ cho Kid Mode (tone pastel), thay footer tối của hệ thống kỹ thuật. */
export const KidFooter: React.FC = () => (
  <footer className="mt-10 border-t-4 border-amber-200 bg-gradient-to-r from-sky-100 via-white to-amber-100 px-4 py-6">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-orange-400 text-white shadow">
          <Star size={20} fill="currentColor" />
        </span>
        <span className="text-xl font-black text-sky-700">
          CyberSoft <span className="text-pink-500">Kids Hub</span>
        </span>
      </div>
      <p className="text-base font-bold text-slate-600">Ươm mầm tư duy công nghệ cho thế hệ tương lai 🌱</p>
      <nav aria-label="Liên kết nhanh" className="flex flex-wrap items-center justify-center gap-3 text-base font-bold">
        <Link to="/profile" className="rounded-full bg-sky-100 px-4 py-1.5 text-sky-700 no-underline hover:bg-sky-200">
          Trang của bé
        </Link>
        <Link to="/kid-leaderboard" className="rounded-full bg-amber-100 px-4 py-1.5 text-amber-700 no-underline hover:bg-amber-200">
          Bảng Vinh Danh
        </Link>
      </nav>
      <p className="text-sm font-semibold text-slate-500">
        © 2026 CyberSoft Academy. Bản quyền thuộc về Hệ thống Đào tạo Lập trình CyberSoft.
      </p>
    </div>
  </footer>
);
