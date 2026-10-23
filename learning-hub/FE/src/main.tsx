import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/nunito'; // font tròn, đủ dấu tiếng Việt, cho Kid Mode (tự host, không gọi CDN)
import './styles/main.css';
import App from './App.tsx';
import { ToastProvider } from './components/Toast.tsx';

// Dữ liệu "tươi" 10 giây; lỗi mạng không tự thử lại liên tục (BE có giới hạn tần suất).
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
