"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/axiosInstance";
import { Dropdown } from "../ui/dropdown/Dropdown";

interface VendorNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  createdAt: string;
  data?: any;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const getRedirectPath = (notif: VendorNotification) => {
  const type = notif.type;
  const data = notif.data || {};
  const title = (notif.title || "").toLowerCase();

  if (type === "kyc_update") return "/kyc";
  if (type === "order_request") return "/order";
  if (type === "quote_request") return "/quote";
  if (type === "product_update") {
    // service ke liye serviceId hoga ya title mein "service" hoga
    if (data.serviceId || title.includes("service")) return "/service";
    return "/product";
  }
  return "/";
};

const getTypeColor = (type: string, isReject: boolean) => {
  if (isReject) return "bg-red-100 text-red-600";
  if (type === "kyc_update") return "bg-purple-100 text-purple-600";
  if (type === "product_update") return "bg-green-100 text-green-600";
  if (type === "quote_request") return "bg-blue-100 text-blue-600";
  if (type === "order_request") return "bg-orange-100 text-orange-600";
  return "bg-gray-100 text-gray-600";
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await api.get("vendor/auth/notifications");
      if (res.data.success) setNotifications(res.data.data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    setNotifications((prev) =>
      prev.map((n) => (n._id === id || (n as any).id === id ? { ...n, is_read: true } : n))
    );
    await api.put(`vendor/auth/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await api.put("vendor/auth/notifications/read-all").catch(() => {});
  }, []);

  useEffect(() => {
    // Sirf mount pe fetch karo — no polling
    fetchNotifications();

    // Listen for socket notifications to refresh
    const handleNewNotif = () => {
      fetchNotifications();
    };
    window.addEventListener('new_notification', handleNewNotif);
    return () => window.removeEventListener('new_notification', handleNewNotif);
  }, [fetchNotifications]);

  // Jab dropdown open ho tab fresh fetch karo
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotifClick = async (notif: VendorNotification) => {
    const id = notif._id || (notif as any).id;
    await markAsRead(id);
    setIsOpen(false);
    router.push(getRedirectPath(notif));
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[380px] lg:right-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <ul className="flex flex-col flex-1 overflow-y-auto custom-scrollbar gap-0.5">
          {loading && notifications.length === 0 ? (
            <li className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </li>
          ) : notifications.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications yet</p>
            </li>
          ) : (
            notifications.slice(0, 15).map((notif) => {
              const id = notif._id || (notif as any).id;
              const isReject = notif.title?.toLowerCase().includes("reject");
              return (
                <li key={id}>
                  <button
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                      !notif.is_read ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${getTypeColor(notif.type, isReject)}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p 
                        title={notif.title}
                        className={`text-sm font-semibold truncate ${isReject ? "text-red-600" : !notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {notif.title}
                      </p>
                      <p 
                        title={notif.body?.replace(/<[^>]*>?/gm, '')}
                        className={`text-xs mt-0.5 line-clamp-2 ${isReject ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                        <span dangerouslySetInnerHTML={{ __html: notif.body }} />
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>

                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
