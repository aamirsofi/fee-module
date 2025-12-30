import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  darkMode?: boolean;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  darkMode = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Check available space and determine if dropdown should open upward
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 240; // Approximate max height (60px per item * 4 items)

      // Open upward if there's not enough space below but enough space above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-300 cursor-pointer relative ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border-indigo-500/50 text-gray-100 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
            : 'bg-white border-indigo-400/60 text-gray-900 hover:border-indigo-500 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm'
        } ${isOpen ? (darkMode ? 'border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)]' : 'border-indigo-500 shadow-[0_4px_25px_rgba(99,102,241,0.4)]') : ''}`}
      >
        <span className="block pr-8 truncate text-left">{selectedOption?.label || placeholder}</span>
        <svg
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${
            darkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full rounded-xl border-2 overflow-hidden shadow-2xl ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border-indigo-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl border-indigo-400/60 shadow-[0_8px_32px_rgba(99,102,241,0.2)]'
          }`}
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-5 py-3 text-left text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? darkMode
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border-l-4 border-indigo-400'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-l-4 border-indigo-500'
                      : darkMode
                        ? 'text-gray-200 hover:bg-gray-700/50 hover:text-indigo-300'
                        : 'text-gray-900 hover:bg-indigo-50/50 hover:text-indigo-600'
                  } ${index === 0 ? '' : darkMode ? 'border-t border-gray-700/50' : 'border-t border-gray-200/50'}`}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg
                      className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

