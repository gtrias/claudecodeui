import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';
// Initialize i18n
import './i18n/config.js';
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
// Clean up stale service workers on app load to prevent caching issues after builds
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
        });
    }).catch(err => {
        console.warn('Failed to unregister service workers:', err);
    });
}
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
}
