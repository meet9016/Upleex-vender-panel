'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getUser, clearToken } from '@/utils/tokenManager';
import { useRouter } from 'next/navigation';
import { api } from "@/utils/axiosInstance";
import NotificationList from './NotificationList'; // Import the list
import endPointApi from '@/utils/endPointApi';
import Link from 'next/link';
import { GoPeople } from 'react-icons/go';
import { IoSettingsOutline } from 'react-icons/io5';
import { MdOutlinePayments } from 'react-icons/md';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFetchingRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await api.get(endPointApi.getNotifications);
      if (res.data.success) {
        const count = res.data.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch {
      // silent fail
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const loggedInUser = getUser();
      setUser(loggedInUser || null);
      fetchUnreadCount();
    } else {
      // Reset notification state when sheet closes
      setNotificationsOpen(false);
      setProfileOpen(false);
    }

    const handleNewNotif = () => {
      fetchUnreadCount();
    };
    window.addEventListener('new_notification', handleNewNotif);
    return () => window.removeEventListener('new_notification', handleNewNotif);
  }, [isOpen, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleLogout = () => {
    clearToken();
    router.replace('/signin');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[2rem] shadow-2xl z-[10000] lg:hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Main Actions */}
              <div className="space-y-4">
                {/* Notifications Button */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <button 
                    onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                    className="flex items-center justify-between w-full"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isNotificationsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Collapsible Notification List */}
                  <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <NotificationList />
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                {/* Other Children (Wallet, Theme, etc) */}
                {children}
              </div>

              {/* User Profile Section - Moved to bottom */}
              {user && (
                <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button 
                    onClick={() => setProfileOpen(!isProfileOpen)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
                      {user.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-white truncate">
                        {user.full_name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50"
                      >
                        <ul className="flex flex-col p-2 gap-1">
                          <li>
                            <Link
                              href="/profile"
                              onClick={onClose}
                              className="flex items-center gap-3 px-4 py-3 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              <GoPeople size={20} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
                              Edit profile
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/settings"
                              onClick={onClose}
                              className="flex items-center gap-3 px-4 py-3 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              <IoSettingsOutline size={22} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
                              Settings
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/payouts"
                              onClick={onClose}
                              className="flex items-center gap-3 px-4 py-3 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              <MdOutlinePayments size={22} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
                              Payment Release
                            </Link>
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="p-6 pt-0">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 w-full p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl font-bold transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="currentColor" />
                </svg>
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};