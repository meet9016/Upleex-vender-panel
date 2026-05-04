"use client";
import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GridIcon, BoxIcon, ListIcon, WalletIcon } from "@/icons";
import { DiamondPlus } from "lucide-react";
import { BsChatSquareQuote } from "react-icons/bs";
import { useFilter } from "@/context/FilterContext";
import { useKyc } from "@/context/KycContext";

const BottomNav = () => {
  const pathname = usePathname() ?? "";
  const { filters } = useFilter();
  const { kycApproved } = useKyc();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  if (kycApproved === false) return null;

  const items = [
    { icon: <GridIcon />, name: "Home", path: "/" },
    ...(filters.vendor !== false || (!filters.service && !filters.vendor)
      ? [{ icon: <DiamondPlus size={20} />, name: "Products", path: "/product" }]
      : []),
    { icon: <BsChatSquareQuote size={20} />, name: "Quotes", path: "/quote" },
    { icon: <ListIcon />, name: "Orders", path: "/order" },
    { icon: <WalletIcon />, name: "Wallet", path: "/wallet" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9998] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
              isActive(item.path)
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className={`text-xl ${isActive(item.path) ? "text-brand-600 dark:text-brand-400" : ""}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium leading-tight">{item.name}</span>
            {isActive(item.path) && (
              <span className="w-1 h-1 rounded-full bg-brand-600 dark:bg-brand-400 mt-0.5" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default memo(BottomNav);
