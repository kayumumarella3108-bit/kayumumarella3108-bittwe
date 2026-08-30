import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and filter out cosmetic Firestore future update time warnings and quota log messages
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppress = (args: any[]) => {
  return args.some(arg => {
    if (!arg) return false;
    const str = typeof arg === 'string' ? arg : (arg?.message ? String(arg.message) : String(arg));
    return (
      str.includes('Detected an update time that is in the future') ||
      str.includes('@firebase/firestore: Firestore') ||
      str.includes('Using maximum backoff delay') ||
      str.includes('resource-exhausted') ||
      str.includes('Quota limit exceeded') ||
      str.includes('Free daily write units') ||
      str.includes('Free daily read units') ||
      str.includes('Quota exceeded')
    );
  });
};

console.error = (...args: any[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  if (shouldSuppress(args)) return;
  originalConsoleWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker only in production; unregister in dev to prevent module caching conflicts
if ('serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registered with scope: ', registration.scope);
        })
        .catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
    });
  } else {
    // Unregister any active service worker during development/preview to avoid caching Vite HMR modules
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}
