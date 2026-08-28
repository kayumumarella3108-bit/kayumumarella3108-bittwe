import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and filter out cosmetic Firestore future update time warnings caused by client-server clock drift
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppress = (args: any[]) => {
  return args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('Detected an update time that is in the future') || arg.includes('@firebase/firestore: Firestore'))
  );
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
