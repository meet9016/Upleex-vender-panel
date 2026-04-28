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
import { KycGuard } from "@/components/common/KycGuard";
import { KycProvider } from "@/context/KycContext";
import SocketHandler from "@/components/common/SocketHandler";
import Loader from "@/components/common/Loader";
import PageLoader from "@/components/common/PageLoader";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const { breadcrumbs } = useBreadcrumb();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const mainContentMargin = useMemo(() => {
    if (isMobileOpen) return "ml-0";
    return isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  }, [isMobileOpen, isExpanded, isHovered]);

  const displayBreadcrumbs = breadcrumbs;

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/signin");
    } else {
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking || !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100">
      <SocketHandler />
      <AppSidebar />
      <Backdrop />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <main className="flex-1 p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 mb-20 lg:mb-0">
          {/* Common Top Row for Breadcrumbs (Hidden on Dashboard) */}
          {pathname !== "/" && pathname !== null && pathname !== "" && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <PageBreadcrumb breadcrumbs={displayBreadcrumbs || undefined} />
            </div>
          )}

          <div className="animate-in fade-in duration-700 delay-200">
            <BreadcrumbProvider>
              <KycGuard>
                {children}
              </KycGuard>
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
          <KycProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
          </KycProvider>
        </BreadcrumbProvider>
      </WalletProvider>
    </FilterProvider>
  );
}
