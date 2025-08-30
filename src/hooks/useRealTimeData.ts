import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export interface RealTimeConfig {
  channel: string;
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface RealTimeStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
  reconnectAttempts: number;
}

export interface RealTimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export const useRealTimeData = <T = any>(config: RealTimeConfig) => {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<RealTimeStatus>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleRealtimeUpdate = useCallback((payload: RealTimePayload<T>) => {
    setData(currentData => {
      let updatedData = [...currentData];

      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            updatedData.push(payload.new);
          }
          break;
        
        case 'UPDATE':
          if (payload.new) {
            const index = updatedData.findIndex(item => 
              (item as any).id === (payload.new as any).id
            );
            if (index !== -1) {
              updatedData[index] = payload.new;
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
  }, []);

  const handleConnectionStatus = useCallback((status: string) => {
    console.log('Real-time connection status:', status);
    
    setStatus(prev => {
      const newStatus = {
        ...prev,
        connected: status === 'SUBSCRIBED',
        connecting: status === 'CHANNEL_ERROR' ? false : prev.connecting,
        error: status === 'CHANNEL_ERROR' ? 'Connection failed' : null
      };

      // Handle reconnection logic
      if (status === 'CHANNEL_ERROR' && config.enabled !== false) {
        const maxAttempts = config.reconnectAttempts || 5;
        if (prev.reconnectAttempts < maxAttempts) {
          const delay = (config.reconnectDelay || 5000) * Math.pow(2, prev.reconnectAttempts);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting reconnection ${prev.reconnectAttempts + 1}/${maxAttempts}`);
            connect();
          }, delay);

          newStatus.reconnectAttempts = prev.reconnectAttempts + 1;
        } else {
          toast({
            title: "Connection Lost",
            description: "Real-time updates are currently unavailable.",
            variant: "destructive"
          });
        }
      } else if (status === 'SUBSCRIBED') {
        newStatus.reconnectAttempts = 0;
        newStatus.error = null;
        
        if (prev.reconnectAttempts > 0) {
          toast({
            title: "Connection Restored",
            description: "Real-time updates are now working.",
            variant: "default"
          });
        }
      }

      return newStatus;
    });
  }, [config.enabled, config.reconnectAttempts, config.reconnectDelay, toast]);

  const connect = useCallback(() => {
    if (!config.enabled || channelRef.current) return;

    setStatus(prev => ({ ...prev, connecting: true }));

    try {
      const channel = supabase.channel(config.channel);

      if (config.table) {
        channel.on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: 'public',
            table: config.table,
            filter: config.filter
          } as any,
          handleRealtimeUpdate
        );
      }

      channel.subscribe((status) => {
        handleConnectionStatus(status);
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('Real-time connection error:', error);
      setStatus(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [config, handleRealtimeUpdate, handleConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStatus(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, []);

  const sendMessage = useCallback(async (payload: any) => {
    if (!channelRef.current || !status.connected) {
      throw new Error('Real-time channel not connected');
    }

    try {
      const response = await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload
      });

      if (response !== 'ok') {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending real-time message:', error);
      throw error;
    }
  }, [status.connected]);

  // Initialize connection
  useEffect(() => {
    if (config.enabled !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [config.enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    status,
    connect,
    disconnect,
    sendMessage,
    setData
  };
};