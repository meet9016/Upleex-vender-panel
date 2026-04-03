import React from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LoaderProps {
  type?: 'page' | 'section' | 'button' | 'icon';
  text?: string;
  className?: string;
  iconClassName?: string;
}

export default function Loader({
  type = 'icon',
  text,
  className,
  iconClassName
}: LoaderProps) {

  if (type === 'page') {
    return (
      <div className={cn("flex items-center justify-center min-h-screen bg-slate-50/80 backdrop-blur-sm z-50", className)}>
        <div className="text-center">
          <LuLoaderCircle className={cn("animate-spin text-indigo-600 h-16 w-16 mx-auto mb-4", iconClassName)} />
          {text && <p className="text-lg font-semibold text-slate-700">{text}</p>}
        </div>
      </div>
    );
  }

  if (type === 'section') {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-[1px]", className)}>
        <div className="text-center">
          <LuLoaderCircle className={cn("animate-spin text-indigo-600 h-10 w-10 mx-auto mb-3", iconClassName)} />
          {text && <p className="text-sm font-semibold text-slate-600 italic">{text}</p>}
        </div>
      </div>
    );
  }

  if (type === 'button') {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <LuLoaderCircle className={cn("animate-spin h-5 w-5", iconClassName)} />
        {text && <span>{text}</span>}
      </div>
    );
  }

  // Default 'icon' type
  return <LuLoaderCircle className={cn("animate-spin h-5 w-5", className, iconClassName)} />;
}
