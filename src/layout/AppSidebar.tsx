"use client";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { CalenderIcon, GridIcon, HorizontaLDots } from "../icons/index";
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
  { icon: <BsChatSquareQuote className="w-5 h-5" />, name: "Quote", path: "/quote" },
  { icon: <CalenderIcon />, name: "Drafts", path: "/draft" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.post(endPointApi.postFetchVendorKYCFormData as string);
        const status = res?.data?.data?.status || "";
        if (!mounted) return;
        setKycApproved(String(status).toLowerCase() === "approved");
      } catch {
        if (!mounted) return;
        setKycApproved(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (kycApproved === false && pathname !== "/kyc") {
      router.push("/kyc");
    }
  }, [kycApproved, pathname, router]);

  const visibleItems = useMemo(() => {
    if (kycApproved === false) {
      return navItems.filter((n) => n.path === "/kyc");
    }
    return navItems;
  }, [kycApproved]);

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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all border-r ${
        showExpanded ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" aria-label="Home">
          {showExpanded ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/upleex-logo-dark.png"
                alt="Upleex Logo"
                width={150}
                height={40}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/upleex-logo.png"
                alt="Upleex Logo"
                width={150}
                height={40}
                priority
              />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Upleex" width={32} height={32} priority />
          )}
        </Link>
      </div>

      <nav className="flex flex-col overflow-y-auto duration-300 no-scrollbar">
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
      </nav>
    </aside>
  );
};

export default memo(AppSidebar);
