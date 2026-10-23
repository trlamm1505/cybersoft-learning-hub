import { useEffect, useState } from 'react';

const DARK_CLASS = 'theme-dark';

/** Đang ở giao diện Tối của app (class trên <html>), tự cập nhật khi người dùng bấm đổi giao diện. */
export function useIsDarkTheme(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains(DARK_CLASS));

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains(DARK_CLASS));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export default useIsDarkTheme;
