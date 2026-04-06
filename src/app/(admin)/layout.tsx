"use client";

import { useSidebar } from "@/context/SidebarContext";
import { FilterProvider } from "@/context/FilterContext";
import { WalletProvider } from "@/context/WalletContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { BreadcrumbProvider, useBreadcrumb } from "@/context/BreadcrumbContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { breadcrumbs } = useBreadcrumb();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mainContentMargin = useMemo(() => {
    if (isMobileOpen) return "ml-0";
    return isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  }, [isMobileOpen, isExpanded, isHovered]);

  // Fallback Breadcrumb Trail detection based on pathname
  const fallbackBreadcrumbs = useMemo(() => {
    const safePathname = pathname || "";
    const segments = safePathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return [{ label: "Dashboard" }];
    }

    const trail: { label: string; path: string }[] = [];
    let currentPath = "";

    segments.forEach((segment) => {
      currentPath += `/${segment}`;

      // Convert kebab-case or snake_case to Title Case
      const label = segment
        .replace(/[-_]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase like addProduct
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      trail.push({ label, path: currentPath });
    });

    return trail;
  }, [pathname]);

  const displayBreadcrumbs = breadcrumbs || fallbackBreadcrumbs;

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/signin");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100">
      <AppSidebar />
      <Backdrop />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <main className="flex-1 p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 mb-20 lg:mb-0">
          {/* Common Top Row for Breadcrumbs (Hidden on Dashboard) */}
          {pathname !== "/" && pathname !== null && pathname !== "" && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <PageBreadcrumb breadcrumbs={displayBreadcrumbs} />
            </div>
          )}

          <div className="animate-in fade-in duration-700 delay-200">
            <BreadcrumbProvider>
      {children}
    </BreadcrumbProvider>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider>
      <WalletProvider>
        <BreadcrumbProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </BreadcrumbProvider>
      </WalletProvider>
    </FilterProvider>
  );
}
