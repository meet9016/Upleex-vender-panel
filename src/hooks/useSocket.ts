'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3688';

export const useSocket = (vendorId: string | undefined, type: 'vendor' = 'vendor') => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const vendorIdRef = useRef<string | undefined>(vendorId);

  useEffect(() => {
    vendorIdRef.current = vendorId;
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) {
      console.log('Socket not initialized: No vendor ID provided');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current && vendorIdRef.current === vendorId) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log(`Connecting to Socket server: ${SOCKET_URL} for vendor ${vendorId}`);
    socketRef.current = io(SOCKET_URL, {
       path : '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Vendor Socket connected:', socketRef.current?.id);
      setIsConnected(true);
      socketRef.current?.emit('join', { id: vendorId, type });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Vendor Socket connection error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Vendor Socket disconnected');
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [vendorId, type]);

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, isConnected, on, off, emit };
};

export default useSocket;
