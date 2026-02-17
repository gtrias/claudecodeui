import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexClientProvider } from './ConvexClientProvider';
import { TRPCProvider } from './lib/TRPCProvider';
import './index.css';
import 'katex/dist/katex.min.css';

// Note: i18n config removed - locales available in i18n/locales/

// Global error handlers for uncaught errors
window.addEventListener('error', (event) => {
  console.error('🔴 UNCAUGHT ERROR:', event.error);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno, 'Column:', event.colno);
  // Error will be caught by ErrorBoundary if in React tree
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
  console.error('Promise:', event.promise);
  // Show alert for critical promise rejections
  if (event.reason && event.reason.message) {
    console.error('Rejection reason:', event.reason.message);
  }
});

// Note: Service worker is now automatically registered by vite-plugin-pwa

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ConvexClientProvider>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </ConvexClientProvider>
    </React.StrictMode>,
  );
}
