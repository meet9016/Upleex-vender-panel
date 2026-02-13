"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();

  const mainContentMargin = useMemo(() => {
    if (isMobileOpen) return "ml-0";
    return isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  }, [isMobileOpen, isExpanded, isHovered]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) router.push("/signin");
  }, [router]);

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <main className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</main>
      </div>
    </div>
  );
}
