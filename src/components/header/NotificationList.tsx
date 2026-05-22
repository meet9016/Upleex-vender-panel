'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Image from "next/image";
import Link from "next/link";

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

  if (type === "payment_update" || title.includes("payment")  || title.includes("released")) return "/payouts";
  if (type === "kyc_update") return "/kyc";
  if (type === "order_request") return "/order";
  if (type === "quote_request") return "/quote";
  if (type === "product_update") {
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
  if (type === "payment_update") return "bg-orange-100 text-orange-600"
  return "bg-gray-100 text-gray-600";
};

export default function NotificationList() {
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
      const res = await api.get(endPointApi.getNotifications);
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
    await api.put(`${endPointApi.markNotificationRead}/${id}/read`).catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleNewNotif = () => {
      fetchNotifications();
    };
    window.addEventListener('new_notification', handleNewNotif);
    return () => window.removeEventListener('new_notification', handleNewNotif);
  }, [fetchNotifications]);

  const handleNotifClick = async (notif: VendorNotification) => {
    const id = notif._id || (notif as any).id;
    await markAsRead(id);
    router.push(getRedirectPath(notif));
  };

  return (
    <div className="max-h-[40vh] overflow-y-auto -mx-4 custom-scrollbar">
      <ul className="flex flex-col gap-0.5">
        {loading && notifications.length === 0 ? (
          <li className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </li>
        ) : notifications.length === 0 ? (
          <li className="flex flex-col items-center justify-center py-8 text-center px-4">
             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications yet</p>
          </li>
        ) : (
          notifications.slice(0, 20).map((notif) => {
            const id = notif._id || (notif as any).id;
            const isReject = notif.title?.toLowerCase().includes("reject");
            return (
              <li key={id}>
                <button
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex gap-3 px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                    !notif.is_read ? "bg-brand-50/40 dark:bg-brand-900/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${getTypeColor(notif.type, isReject)}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isReject ? "text-red-600" : !notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isReject ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                       <span dangerouslySetInnerHTML={{ __html: notif.body }} />
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                  </div>

                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
