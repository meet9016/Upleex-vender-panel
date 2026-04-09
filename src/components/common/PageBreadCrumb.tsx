"use client";

import React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageBreadcrumbProps {
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ breadcrumbs }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Use custom breadcrumbs if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

    return (
      <div className="relative  border border-gray-200 overflow-hidden bg-white dark:bg-gray-900 rounded-xl mb-3 flex flex-col justify-center px-6 py-4">
      {/* Blue Left Accent Bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-sky-500 rounded-l-xl"></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{pageTitle}</h1>
        </div>
     {/* BREADCRUMB TRAIL */}
        {/* <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[13px] font-medium">
            <li className="flex items-center">
              <Link
                href="/"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutGrid size={14} className="opacity-70" />
              </Link>
            </li>

            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  <li className="flex items-center text-gray-400 dark:text-gray-600">
                    <ChevronRight size={14} strokeWidth={2} />
                  </li>
                  <li>
                    {isLast || !item.path ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[150px] sm:max-w-none px-0.5">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.path}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors truncate max-w-[150px] sm:max-w-none"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav> */}
          </div>
    );
  }

  // Auto-detect from URL
  const segments = (pathname || "").split("/").filter(Boolean);
  const hasId = searchParams?.has('id');
  const hasEdit = segments.includes('edit');
  const hasAdd = segments.some(s => s.toLowerCase().includes('add'));
  
  let pageTitle = "Dashboard";
  if (segments.length > 0) {
    const section = segments[0]
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    
    if (hasEdit || hasId) pageTitle = `Edit ${section}`;
    else if (hasAdd) pageTitle = `Add ${section}`;
    else pageTitle = segments[segments.length - 1]
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return (
    <div className="relative border border-gray-200 overflow-hidden bg-white dark:bg-gray-900 rounded-xl mb-3 flex flex-col justify-center px-6 py-4">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-sky-500 rounded-l-xl"></div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{pageTitle}</h1>
      </div>
    </div>
  );
};

export default PageBreadcrumb;