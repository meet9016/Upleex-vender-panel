"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MdKeyboardArrowDown, MdClose, MdCheck } from 'react-icons/md';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  maxSelections,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const normalize = (str: string) => String(str || '').toLowerCase().replace(/_/g, ' ');

  const selectedOptions = options.filter(option => 
    selectedValues.some(v => normalize(v) === normalize(option.value))
  );

  const handleToggleOption = (value: string) => {
    if (selectedValues.some(v => normalize(v) === normalize(value))) {
      onChange(selectedValues.filter(v => normalize(v) !== normalize(value)));
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return;
      }
      onChange([...selectedValues, value]);
    }
  };

  const handleRemoveOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => normalize(v) !== normalize(value)));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`min-h-[40px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                >
                  {option.label}
                  <button
                    onClick={(e) => handleRemoveOption(option.value, e)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <MdClose size={12} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedOptions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <MdClose size={16} />
              </button>
            )}
            <MdKeyboardArrowDown
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              size={20}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.some(v => normalize(v) === normalize(option.value));
                const isDisabled = maxSelections && !isSelected && selectedValues.length >= maxSelections;
                
                return (
                  <div
                    key={option.value}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => !isDisabled && handleToggleOption(option.value)}
                  >
                    <div className={`w-4 h-4 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : ''
                    }`}>
                      {isSelected && <MdCheck className="text-white" size={12} />}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;