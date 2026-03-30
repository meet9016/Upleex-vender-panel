import { useSidebar } from "@/context/SidebarContext";
import React from "react";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
