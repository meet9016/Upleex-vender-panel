"use client";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useFilter } from "../context/FilterContext";
import { CalenderIcon, GridIcon, HorizontaLDots, BoxIcon, DocsIcon, ListIcon, DollarLineIcon, TaskIcon, WalletIcon } from "../icons/index";
import { BsChatSquareQuote } from "react-icons/bs";
import endPointApi from "@/utils/endPointApi";
import { api } from "@/utils/axiosInstance";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/" },
  { icon: <CalenderIcon />, name: "KYC", path: "/kyc" },
  { icon: <CalenderIcon />, name: "Product", path: "/product" },
  { icon: <TaskIcon />, name: "Service", path: "/service" },
  { icon: <BsChatSquareQuote className="w-5 h-5" />, name: "Quote", path: "/quote" },
  // { icon: <DollarLineIcon />, name: "Purchased", path: "/purchasedplan" },
  { icon: <ListIcon />, name: "Orders", path: "/order" },
  { icon: <WalletIcon />, name: "Wallet", path: "/wallet" },
  { icon: <DocsIcon />, name: "Drafts", path: "/draft" },

];

// KYC only nav items for initial render
const kycOnlyItems: NavItem[] = [
  { icon: <CalenderIcon />, name: "KYC", path: "/kyc" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { filters } = useFilter();
  const pathname = usePathname();
  const router = useRouter();
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.post(endPointApi.postFetchVendorKYCFormData as string);
        const status = res?.data?.data?.status || "";
        if (!mounted) return;
        const approved = String(status).toLowerCase() === "approved";
        setKycApproved(approved);
      } catch {
        if (!mounted) return;
        setKycApproved(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);



  const visibleItems = useMemo(() => {
    if (isLoading) {
      return []; // Show nothing while loading
    }
    if (kycApproved === false) {
      return kycOnlyItems; // Show only KYC if not approved
    }

    // Filter items based on selected type
    const filteredItems = navItems.filter(item => {
      // If only vendor is selected, show Product but not Service
      if (filters.vendor && !filters.service) {
        if (item.path === '/service') return false; // Hide Service
        return true; // Show Product and others
      }

      // If only service is selected, show Service but not Product
      if (filters.service && !filters.vendor) {
        if (item.path === '/product') return false; // Hide Product
        return true; // Show Service and others
      }

      // If both are selected or none selected, show both
      return true;
    });

    return filteredItems;
  }, [kycApproved, isLoading, filters]);

  const isActive = useCallback(
    (path: string) => {
      const current = pathname ?? "";
      if (path === "/") return current === "/";
      return current.startsWith(path);
    },
    [pathname]
  );

  const handleMouseEnter = useCallback(() => {
    if (!isExpanded) setIsHovered(true);
  }, [isExpanded, setIsHovered]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, [setIsHovered]);

  const showExpanded = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 border-r z-[100] ${showExpanded ? "w-[290px]" : "w-[90px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" aria-label="Home" onClick={() => {
          if (isMobileOpen) {
            toggleMobileSidebar();
          }
        }}>
          {showExpanded ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/upleex-logo-dark.jpg"
                alt="Upleex Logo"
                width={150}
                height={40}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/dark-logo.jpg"
                alt="Upleex Logo"
                width={150}
                height={40}
                priority
              />
            </>
          ) : (
            <Image src="/images/logo/small-logo.webp" alt="Upleex" width={32} height={32} priority />
          )}
        </Link>
      </div>

      <nav className="flex flex-col overflow-y-auto duration-300 no-scrollbar">
        {!isLoading && (
          <>
            <h2 className={`mb-4 text-xs uppercase flex text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
              {showExpanded ? "Menu" : <HorizontaLDots />}
            </h2>

            <ul className="flex flex-col gap-4">
              {visibleItems.map((nav) => (
                <li key={nav.name}>
                  <Link
                    href={nav.path}
                    className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                    aria-current={isActive(nav.path) ? "page" : undefined}
                  >
                    <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                      {nav.icon}
                    </span>
                    {showExpanded && <span className="menu-item-text">{nav.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Optional: Show loading indicator while fetching status */}
      {isLoading && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      )}
    </aside>
  );
};

export default memo(AppSidebar);
