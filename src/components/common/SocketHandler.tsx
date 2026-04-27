'use client';

import { useEffect, useCallback } from 'react';
import useSocket from '@/hooks/useSocket';

const SocketHandler = () => {
  
  let vendorId: string | undefined;
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      vendorId = user._id || user.id;
    }
  } catch (e) {
    console.error('Error parsing vendor from localStorage', e);
  }

  const { socket } = useSocket(vendorId, 'vendor');

  const handleVendorNotification = useCallback((notification: any) => {
    console.log('Received vendor notification via socket:', notification);
    
    window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
  }, []);

  useEffect(() => {
    if (!socket || !vendorId) return;

    socket.on('new_notification', handleVendorNotification);

    return () => {
      socket.off('new_notification', handleVendorNotification);
    };
  }, [socket, vendorId, handleVendorNotification]);

  return null;
};

export default SocketHandler;
