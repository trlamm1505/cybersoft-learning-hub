import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

// Header bảo mật cơ bản cả khi chạy dev/preview (bản đầy đủ có CSP nằm ở security-headers.conf của nginx;
// dev server không đặt CSP vì HMR của Vite cần script inline và websocket).
const BASE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.VITE_API_URL || 'http://localhost:3000/api').origin
  } catch {
    return ''
  }
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    headers: {
      ...BASE_SECURITY_HEADERS,
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: ${API_ORIGIN}; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${API_ORIGIN}; frame-src 'self' https://www.youtube-nocookie.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`,
    },
  },
  server: {
    headers: BASE_SECURITY_HEADERS,
    fs: {
      // Cho phép import bộ mẫu phát hiện API key dùng chung với BE (một nguồn duy nhất).
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        path.resolve(import.meta.dirname, '../BE/src/common/security'),
      ],
    },
  },
})
