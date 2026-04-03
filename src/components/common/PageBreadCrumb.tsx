import React from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageBreadcrumbProps {
  breadcrumbs: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ breadcrumbs }) => {
  // The page title is always the last item in the breadcrumb array
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <div className="relative  border border-gray-200 overflow-hidden bg-white dark:bg-gray-900 rounded-xl mb-3 flex flex-col justify-center min-h-[90px] px-6 py-4">
      {/* Blue Left Accent Bar */}
     <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-sky-500 rounded-l-xl"></div>

      <div className="flex flex-col gap-1">
        {/* PAGE TITLE */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {pageTitle}
        </h1>

        {/* BREADCRUMB TRAIL */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[13px] font-medium">
            <li className="flex items-center">
              <Link
                href="/"
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutGrid size={14} className="opacity-70" />
                {/* Dashboard */}
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
        </nav>
      </div>
    </div>
  );
};

export default PageBreadcrumb;