import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isVisible]);

  const positionStyles = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const space = 8;

    switch (position) {
      case 'top':
        return {
          top: coords.top - space,
          left: coords.left + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: coords.top + rect.height + space,
          left: coords.left + rect.width / 2,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: coords.top + rect.height / 2,
          left: coords.left - space,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: coords.top + rect.height / 2,
          left: coords.left + rect.width + space,
          transform: 'translate(0, -50%)',
        };
      default:
        return {};
    }
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-800',
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none transition-all duration-300"
          style={positionStyles()}
        >
          <div className="relative px-3 py-1.5 text-[11px] font-bold text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
            {content}
            <div className={`absolute border-[5px] border-transparent ${arrowClasses[position]}`} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
