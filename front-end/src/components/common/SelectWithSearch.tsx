import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export interface Option {
  value: any;
  label: string;
}

interface SelectWithSearchProps {
  options: Option[];
  selectedValues: any[];
  onChange: (selectedValues: any[]) => void;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  clearable?: boolean;
  error?: string;
}

// Memoized option item component
const OptionItem = React.memo(({ 
  option, 
  isSelected, 
  multiple, 
  onToggle 
}: { 
  option: Option; 
  isSelected: boolean; 
  multiple: boolean; 
  onToggle: (value: any) => void;
}) => (
  <div 
    className="px-3 py-2 flex items-center hover:bg-gray-100 cursor-pointer"
    onClick={() => onToggle(option.value)}
  >
    <input
      type={multiple ? "checkbox" : "radio"}
      checked={isSelected}
      onChange={() => {}}
      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="ml-2 text-sm text-gray-700 truncate">{option.label}</span>
  </div>
));
OptionItem.displayName = 'OptionItem';

const SelectWithSearch: React.FC<SelectWithSearchProps> = React.memo(({
  options,
  selectedValues: rawSelectedValues,
  onChange,
  placeholder = 'Chọn...',
  className = '',
  multiple = false,
  clearable = true,
  error = ''
}) => {
  // Ensure selectedValues is always an array
  const selectedValues = useMemo(() => 
    Array.isArray(rawSelectedValues) ? rawSelectedValues : (rawSelectedValues ? [rawSelectedValues] : []),
    [rawSelectedValues]
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter options based on debounced search term
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [options, debouncedSearchTerm]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
  
  // Handle option selection
  const handleOptionToggle = useCallback((value: any) => {
    if (multiple) {
      const isSelected = selectedValues.some(v => v === value || (v == value));
      const newSelectedValues = isSelected
        ? selectedValues.filter(v => v !== value && !(v == value))
        : [...selectedValues, value];
      
      onChange(newSelectedValues);
    } else {
      // Single select mode - replace the selection
      onChange([value]);
      setIsOpen(false);
    }
  }, [multiple, selectedValues, onChange]);
  
  // Handle select all
  const handleSelectAll = () => {
    if (!multiple) return; // Not applicable in single select mode
    
    // When searching, only select/deselect filtered options
    if (searchTerm) {
      if (filteredOptions.every(option => selectedValues.some(v => v === option.value || (v == option.value)))) {
        // Deselect filtered options
        const newSelectedValues = selectedValues.filter(value => 
          !filteredOptions.some(option => option.value === value || (option.value == value))
        );
        onChange(newSelectedValues);
      } else {
        // Select filtered options
        const newSelectedValues = [...new Set([
          ...selectedValues,
          ...filteredOptions.map(option => option.value)
        ])];
        onChange(newSelectedValues);
      }
    } else {
      // Normal select/deselect all
      if (selectedValues.length === options.length) {
        // Deselect all
        onChange([]);
      } else {
        // Select all
        onChange(options.map(option => option.value));
      }
    }
  };
  
  // Get display text for selected values
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1 || !multiple) {
      const selectedOption = options.find(option => option.value === selectedValues[0] || (option.value == selectedValues[0]));
      return selectedOption ? selectedOption.label : placeholder;
    }
    return `${selectedValues.length} đã chọn`;
  };
  
  // Check if all options are selected (or all filtered options when searching)
  const isAllSelected = multiple ? (searchTerm 
    ? filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.some(v => v === option.value || (v == option.value)))
    : options.length > 0 && selectedValues.length === options.length) : false;
  
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${error ? 'border-red-500' : ''} cursor-pointer w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center`}
        >
          <span className={`truncate ${selectedValues.length === 0 ? 'text-gray-500' : ''}`}>
            {getDisplayText()}
          </span>
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {clearable && selectedValues.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="cursor-pointer absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear selection"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Select all option - only show in multiple mode */}
          {multiple && (
            <div className="px-3 py-2 border-b border-gray-200 sticky top-14 bg-white z-10">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Chọn tất cả</span>
              </label>
            </div>
          )}
          
          {/* Options list */}
          <div className="py-1 overflow-y-auto flex-grow">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option: Option) => (
                <OptionItem
                  key={option.value}
                  option={option}
                  isSelected={selectedValues.some(v => v === option.value || (v == option.value))}
                  multiple={multiple}
                  onToggle={handleOptionToggle}
                />
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SelectWithSearch.displayName = 'SelectWithSearch';

export default SelectWithSearch;
