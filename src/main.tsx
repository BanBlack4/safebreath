import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { I18nProvider } from './i18n';

const cleanupStaleAssets = async () => {
  const cleanupKey = 'safebreath_stale_assets_cleanup_v2';
  if (sessionStorage.getItem(cleanupKey) === 'done') {
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn('Unable to unregister service workers:', error);
    }
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  } catch (error) {
    console.warn('Unable to clear browser caches:', error);
  }

  sessionStorage.setItem(cleanupKey, 'done');
  window.location.reload();
};

void cleanupStaleAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
