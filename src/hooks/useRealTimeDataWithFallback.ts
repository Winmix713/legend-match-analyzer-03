import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export interface RealTimeConfig {
  channel: string;
  table?: keyof Database['public']['Tables'];
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enabled?: boolean;
  pollingInterval?: number;
  maxRetries?: number;
  debounceMs?: number;
}

export interface RealTimeStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fallbackMode: boolean;
  retryAttempt: number;
}

export const useRealTimeDataWithFallback = <T = any>(config: RealTimeConfig) => {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<RealTimeStatus>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null,
    fallbackMode: false,
    retryAttempt: 0
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<Date | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [
    config.channel, 
    config.table, 
    config.enabled, 
    config.pollingInterval
  ]);

  const fetchDataDirectly = useCallback(async () => {
    if (!memoizedConfig.table) return;

    // Debounce rapid fetch requests
    const now = new Date();
    if (lastFetchRef.current && (now.getTime() - lastFetchRef.current.getTime()) < 1000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      const { data: fetchedData, error } = await supabase
        .from(memoizedConfig.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Limit results for better performance

      if (error) throw error;

      setData((fetchedData as T[]) || []);
      setStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        error: null
      }));
    } catch (error) {
      console.error('Error fetching data directly:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [memoizedConfig.table]);

  const debouncedFetchData = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchDataDirectly();
    }, memoizedConfig.debounceMs || 1000); // Increased from 500ms to 1000ms
  }, [fetchDataDirectly, memoizedConfig.debounceMs]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setStatus(prev => ({ ...prev, fallbackMode: true }));
    
    // Use longer polling interval to reduce server load
    const interval = Math.max(memoizedConfig.pollingInterval || 30000, 15000);
    
    pollingIntervalRef.current = setInterval(() => {
      debouncedFetchData();
    }, interval);

    // Initial fetch
    debouncedFetchData();
  }, [debouncedFetchData, memoizedConfig.pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setStatus(prev => ({ ...prev, fallbackMode: false }));
  }, []);

  const handleRealtimeUpdate = useCallback((payload: any) => {
    // Increase debounce for real-time updates to prevent rapid state changes
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setData(currentData => {
        let updatedData = [...currentData];

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              const exists = updatedData.some(item => 
                (item as any).id === (payload.new as any).id
              );
              if (!exists) {
                updatedData.unshift(payload.new as T);
                updatedData = updatedData.slice(0, 100);
              }
            }
            break;
          
          case 'UPDATE':
            if (payload.new) {
              const index = updatedData.findIndex(item => 
                (item as any).id === (payload.new as any).id
              );
              if (index !== -1) {
                updatedData[index] = payload.new as T;
              }
            }
            break;
          
          case 'DELETE':
            if (payload.old) {
              updatedData = updatedData.filter(item => 
                (item as any).id !== (payload.old as any).id
              );
            }
            break;
        }

        return updatedData;
      });

      setStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        error: null
      }));
    }, 300); // Increased from 100ms to 300ms to reduce flickering
  }, []);

  const connectRealTime = useCallback(() => {
    if (!memoizedConfig.enabled || channelRef.current) return;

    setStatus(prev => ({ ...prev, connecting: true }));

    try {
      const channel = supabase.channel(memoizedConfig.channel, {
        config: {
          broadcast: { self: false },
          presence: { key: memoizedConfig.channel }
        }
      });

      if (memoizedConfig.table) {
        // Only listen to INSERT and UPDATE to reduce noise
        const events = memoizedConfig.event === 'INSERT' ? ['INSERT'] : ['INSERT', 'UPDATE'];
        
        events.forEach(event => {
          channel.on(
            'postgres_changes' as any,
            {
              event: event as any,
              schema: 'public',
              table: memoizedConfig.table,
              filter: memoizedConfig.filter
            } as any,
            handleRealtimeUpdate
          );
        });
      }

      channel.subscribe((status) => {
        console.log('Real-time connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          setStatus(prev => ({
            ...prev,
            connected: true,
            connecting: false,
            error: null,
            retryAttempt: 0
          }));
          stopPolling();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setStatus(prev => ({
            ...prev,
            connected: false,
            connecting: false,
            error: 'Real-time connection failed',
            retryAttempt: prev.retryAttempt + 1
          }));

          // Start fallback polling immediately
          startPolling();

          // Retry connection with exponential backoff
          const maxRetries = memoizedConfig.maxRetries || 3;
          setStatus(currentStatus => {
            if (currentStatus.retryAttempt < maxRetries) {
              const delay = Math.min(Math.pow(2, currentStatus.retryAttempt) * 2000, 30000);
              retryTimeoutRef.current = setTimeout(() => {
                disconnect();
                connectRealTime();
              }, delay);
            }
            return currentStatus;
          });
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('Real-time connection error:', error);
      setStatus(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      startPolling();
    }
  }, [memoizedConfig, handleRealtimeUpdate, startPolling, stopPolling]);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    stopPolling();

    setStatus(prev => ({
      ...prev,
      connected: false,
      connecting: false
    }));
  }, [stopPolling]);

  // Initialize connection
  useEffect(() => {
    if (memoizedConfig.enabled !== false) {
      // Start with polling first for immediate data
      startPolling();
      
      // Then try to establish real-time connection
      setTimeout(() => {
        connectRealTime();
      }, 1000);
    }

    return () => {
      disconnect();
    };
  }, [memoizedConfig.enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    status,
    refetch: debouncedFetchData,
    reconnect: connectRealTime,
    disconnect
  };
};
