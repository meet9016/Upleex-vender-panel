"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import WalletHeader from "@/components/header/WalletHeader";
import { useSidebar } from "@/context/SidebarContext";
import { useFilter } from "@/context/FilterContext";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { MobileMenuSheet } from "@/components/header/MobileMenuSheet";
import Checkbox from "@/components/form/input/Checkbox";


const AppHeader = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  // Checkbox states
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { filters, setFilters, canFilter, isLoadingFilter } = useFilter();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  }, [toggleSidebar, toggleMobileSidebar]);

  const toggleApplicationMenu = useCallback(() => {
    setApplicationMenuOpen(prev => !prev);
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen(prev => !prev);
  }, []);

  const handleCheckboxChange = async (type: 'service' | 'vendor') => {
    if (!canFilter) return;
    const newFilters = { ...filters, [type]: !filters[type] };
    setFilters(newFilters);

    // Compute vendor_type from new state and call the API
    const { service, vendor } = newFilters;
    let vendor_type: string;
    if (service && vendor) vendor_type = 'both';
    else if (service) vendor_type = 'service';
    else if (vendor) vendor_type = 'vendor';
    else vendor_type = 'both'; // fallback — nothing selected

    try {
      await api.post(endPointApi.postUpdateVendorType, { vendor_type });
    } catch (err) {
      console.error('Failed to update vendor type:', err);
    }
  };

  // Get selected items count
  const selectedCount = (filters.service ? 1 : 0) + (filters.vendor ? 1 : 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-[9999] dark:border-gray-800 dark:bg-gray-900 lg:border-b shadow-sm lg:shadow-none">
      {!isLoadingFilter && canFilter && !filters.service && !filters.vendor && (
        <div className="hidden lg:block fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm pointer-events-auto" />
      )}
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-400 lg:h-11 lg:w-11 lg:border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.75 6.75H20.25M3.75 12H20.25M3.75 17.25H20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <Link href="/" className="lg:hidden">
            <Image
              className="dark:hidden"
              src="/images/logo/logo.webp"
              alt="Upleex Logo"
              width={120}
              height={32}
              priority
            />
            <Image
              className="hidden dark:block"
              src="/images/logo/dark-logo.jpg"
              alt="Upleex Logo"
              width={120}
              height={32}
              priority
            />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Toggle application menu"
            aria-expanded={isApplicationMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor" />
            </svg>
          </button>

          <div className="hidden lg:block">
            <form role="search">
              <div className="relative">
                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none" aria-hidden="true">
                  <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  aria-label="Search"
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />
              </div>
            </form>
          </div>
        </div>

        <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}>
          <div className="hidden lg:flex items-center gap-2 2xsm:gap-3">
            {/* Dropdown with Checkboxes - Always visible but disabled if canFilter is false */}
            <div className={`relative ${!isLoadingFilter && canFilter && !filters.service && !filters.vendor ? 'z-[999995]' : ''}`} ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${selectedCount > 0
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700'
                  }`}
                aria-label="Toggle selection menu"
                aria-expanded={isDropdownOpen}
              >
                <span>Select Types</span>
                {selectedCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${!canFilter ? 'bg-gray-300 text-gray-500' : 'text-white bg-blue-600'}`}>
                    {selectedCount}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu with Checkboxes */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Select Options</h3>
                  </div>

                  <div className="p-2">
                    {/* Service Checkbox */}
                    <div className="px-1 py-1">
                      <Checkbox
                        label="Service"
                        checked={filters.service}
                        onChange={() => handleCheckboxChange('service')}
                        disabled={!canFilter}
                        className={!canFilter ? 'cursor-not-allowed' : ''}
                      />
                    </div>

                    {/* Vendor Checkbox */}
                    <div className="px-1 py-1 mt-1">
                      <Checkbox
                        label="Vendor"
                        checked={filters.vendor}
                        onChange={() => handleCheckboxChange('vendor')}
                        disabled={!canFilter}
                        className={!canFilter ? 'cursor-not-allowed' : ''}
                      />
                    </div>
                  </div>

                  {/* Locked status message */}
                  {!canFilter && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Selection is locked after KYC submission.
                      </p>
                    </div>
                  )}

                  {/* Selected count display */}
                  {selectedCount > 0 && (
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Guided Tour Tooltip */}
              {!isLoadingFilter && canFilter && !filters.service && !filters.vendor && !isDropdownOpen && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 border-2 border-blue-500 z-[99999]">
                  <div className="absolute -top-[11px] right-6 w-5 h-5 bg-white dark:bg-gray-800 border-l-2 border-t-2 border-blue-500 transform rotate-45"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Select Business Type</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Please select your business type to proceed with the application.</p>
                  </div>
                </div>
              )}
            </div>

            <ThemeToggleButton />
            <WalletHeader />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>

        <MobileMenuSheet isOpen={isApplicationMenuOpen} onClose={toggleApplicationMenu}>
          <div className="space-y-4 pb-4">
            {/* Guided Tour Overlay */}
            {!isLoadingFilter && canFilter && !filters.service && !filters.vendor && (
              <div className="fixed inset-0 z-[999990] bg-black/60 backdrop-blur-sm pointer-events-auto" />
            )}

            {/* Mobile Checkboxes */}
            <div className={`p-4 bg-white dark:bg-gray-800/50 rounded-xl ${!isLoadingFilter && canFilter && !filters.service && !filters.vendor ? 'z-[999995] relative' : ''}`}>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Select Business Type</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-1 rounded-lg transition-all ${filters.service ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Checkbox
                    label="Service"
                    checked={filters.service}
                    onChange={() => handleCheckboxChange('service')}
                    disabled={!canFilter}
                  />
                </div>
                <div className={`p-1 rounded-lg transition-all ${filters.vendor ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Checkbox
                    label="Vendor"
                    checked={filters.vendor}
                    onChange={() => handleCheckboxChange('vendor')}
                    disabled={!canFilter}
                  />
                </div>
              </div>
              {!canFilter && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Selection is locked after KYC submission.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <WalletHeader />
              <ThemeToggleButton />
            </div>
          </div>
        </MobileMenuSheet>
      </div>
    </header>
  );
};

export default memo(AppHeader);