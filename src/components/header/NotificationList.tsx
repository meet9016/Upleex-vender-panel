'use client';
import Image from "next/image";
import Link from "next/link";
import React from "react";

const notifications = [
    {
        id: 1,
        user: {
            name: "John Doe",
            avatar: "/images/user/user-02.jpg",
        },
        time: "12 minutes ago",
        message: "commented on your photo",
        read: false,
    },
    {
        id: 2,
        user: {
            name: "Jane Smith",
            avatar: "/images/user/user-03.jpg",
        },
        time: "3 hours ago",
        message: "started following you",
        read: false,
    },
    {
        id: 3,
        user: {
            name: "System Update",
            avatar: "/images/logo/logo-icon.svg",
        },
        time: "1 day ago",
        message: "Your password has been successfully changed.",
        read: true,
    },
    {
        id: 4,
        user: {
            name: "Sara Johnson",
            avatar: "/images/user/user-04.jpg",
        },
        time: "2 days ago",
        message: "sent you a message.",
        read: true,
    },
];


export default function NotificationList() {
    return (
        <div className="max-h-[40vh] overflow-y-auto -mx-4 custom-scrollbar">
            <ul className="flex flex-col">
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        <Link
                            href="#"
                            className={`flex gap-4 px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                                !notification.read
                                    ? "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                            }`}
                        >
                            <div className="relative h-10 w-10 flex-shrink-0">
                                <Image
                                    width={40}
                                    height={40}
                                    src={notification.user.avatar}
                                    alt={notification.user.name}
                                    className="w-full overflow-hidden rounded-full"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                    <span className="font-bold text-gray-800 dark:text-white">{notification.user.name}</span>{" "}
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                                <div className="h-2.5 w-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-1 self-center"></div>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
