import { useState, useEffect } from 'react';
import { NetworkStatus } from '@/types/api';

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let connectionType = 'unknown';
      let effectiveType = 'unknown';
      let isSlowConnection = false;

      // Check for Network Information API support
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connectionType = connection.type || 'unknown';
          effectiveType = connection.effectiveType || 'unknown';
          
          // Consider 'slow-2g' and '2g' as slow connections
          isSlowConnection = ['slow-2g', '2g'].includes(effectiveType);
        }
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        effectiveType
      });
    };

    // Initial check
    updateNetworkStatus();

    // Event listeners for network status changes
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API change listener
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && 'addEventListener' in connection) {
        connection.addEventListener('change', updateNetworkStatus);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && 'removeEventListener' in connection) {
          connection.removeEventListener('change', updateNetworkStatus);
        }
      }
    };
  }, []);

  return {
    ...networkStatus,
    // Helper methods
    canMakeRequests: networkStatus.isOnline,
    shouldShowOfflineWarning: !networkStatus.isOnline,
    shouldShowSlowConnectionWarning: networkStatus.isOnline && networkStatus.isSlowConnection
  };
};