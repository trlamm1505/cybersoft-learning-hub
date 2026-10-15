import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/nunito'; // font tròn, đủ dấu tiếng Việt, cho Kid Mode (tự host, không gọi CDN)
import './styles/main.css';
import App from './App.tsx';
import { ToastProvider } from './components/Toast.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
