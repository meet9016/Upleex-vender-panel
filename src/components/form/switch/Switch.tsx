"use client";
import React, { useState, useEffect } from "react";

interface SwitchProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  label,
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
  size = "md",
  className = "",
}) => {
  const [isChecked, setIsChecked] = useState(checked !== undefined ? checked : defaultChecked);

  // Update internal state when checked prop changes
  useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (onChange) {
      onChange(newCheckedState);
    }
  };

  const sizeClasses = {
    sm: {
      container: "h-4 w-7",
      knob: "h-3 w-3 left-0.5 top-0.5",
      translate: "translate-x-3"
    },
    md: {
      container: "h-6 w-11",
      knob: "h-5 w-5 left-0.5 top-0.5",
      translate: "translate-x-full"
    },
    lg: {
      container: "h-8 w-14",
      knob: "h-7 w-7 left-0.5 top-0.5",
      translate: "translate-x-6"
    }
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-brand-500 "
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? `${sizeClasses[size].translate} bg-white`
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? `${sizeClasses[size].translate} bg-white`
            : "translate-x-0 bg-white",
        };

  const switchElement = (
    <div className={`relative ${className}`}>
      <div
        className={`block transition duration-150 ease-linear ${sizeClasses[size].container} rounded-full ${
          disabled
            ? "bg-gray-100 pointer-events-none dark:bg-gray-800"
            : switchColors.background
        }`}
      ></div>
      <div
        className={`absolute ${sizeClasses[size].knob} rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
      ></div>
    </div>
  );

  if (label) {
    return (
      <label
        className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
          disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
        }`}
        onClick={handleToggle}
      >
        {switchElement}
        {label}
      </label>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {switchElement}
    </button>
  );
};

export default Switch;
