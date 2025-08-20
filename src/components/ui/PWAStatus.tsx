import React, { useState, useEffect } from 'react';

export const PWAStatus: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsStandalone(true);
    }

    // Check if running in standalone mode
    if (window.navigator.standalone) {
      setIsStandalone(true);
    }

    // Check if service worker is active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setHasServiceWorker(true);
        }
      });
    }
  }, []);

  if (!isInstalled && !isStandalone) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-sm">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>
          {isStandalone ? 'Running as App' : 'PWA Ready'}
        </span>
      </div>
    </div>
  );
};




