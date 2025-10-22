import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useTableAction } from '../../contexts/TableActionContext';
import type { TableAction } from '../../contexts/TableActionContext';

const TableActionDropdown: React.FC = memo(() => {
  const { actions, position, isOpen, setIsOpen, clearActions } = useTableAction();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize dropdown style state - must be before any conditional returns
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '0px',
    left: '0px',
    zIndex: 1000,
    visibility: 'hidden' // Hide initially until we calculate proper position
  });

  // Sort actions: 'add' first, then 'default', then 'delete' - memoize this calculation
  const sortedActions = React.useMemo(() => {
    return [...actions].sort((a, b) => {
      const typeOrder = { add: 0, default: 1, delete: 2 };
      const aType = a.type || 'default';
      const bType = b.type || 'default';
      return typeOrder[aType] - typeOrder[bType];
    });
  }, [actions]);

  // Define all callback functions before any conditional returns
  const handleActionClick = useCallback((action: TableAction) => {
    action.onClick();
    clearActions();
  }, [clearActions]);
  
  // Calculate adjusted position - extracted to a separate function for clarity
  const calculateAdjustedPosition = useCallback((rect: DOMRect, initialX: number, initialY: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedX = initialX;
    let adjustedY = initialY;
    
    // Check if dropdown extends beyond right edge of viewport
    if (initialX + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10; // 10px padding
    }
    
    // Check if dropdown extends beyond bottom edge of viewport
    if (initialY + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10; // 10px padding
    }
    
    // Ensure dropdown doesn't go off the left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);
    
    return { x: adjustedX, y: adjustedY };
  }, []);
  
  // Memoize button class generation for better performance
  const getButtonClass = useCallback((action: TableAction) => {
    const baseClass = 'w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100';
    const customClass = action.className || '';
    let typeClass = 'text-gray-700';
    
    if (action.type === 'delete') typeClass = 'text-red-600';
    else if (action.type === 'add') typeClass = 'text-green-600';
    
    return `${baseClass} ${customClass} ${typeClass}`;
  }, []);
  
  // Memoize the action button to prevent unnecessary re-renders
  const ActionButton = useCallback(({ action }: { action: TableAction }) => (
    <button
      onClick={() => handleActionClick(action)}
      className={getButtonClass(action)}
    >
      {action.icon && <span className="mr-2">{action.icon}</span>}
      {action.label}
    </button>
  ), [handleActionClick, getButtonClass]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [setIsOpen]);
  
  // Use effect to calculate and adjust position after render
  useEffect(() => {
    if (!position || !isOpen) return;
    
    // First set initial position based on trigger position
    setDropdownStyle(prev => ({
      ...prev,
      top: `${position.y}px`,
      left: `${position.x}px`,
      visibility: 'hidden' // Keep hidden until we calculate proper position
    }));
    
    // Use requestAnimationFrame instead of setTimeout for better performance
    const rafId = requestAnimationFrame(() => {
      if (dropdownRef.current) {
        const dropdown = dropdownRef.current;
        const rect = dropdown.getBoundingClientRect();
        
        // Get adjusted position
        const { x: adjustedX, y: adjustedY } = calculateAdjustedPosition(rect, position.x, position.y);
        
        // Update style with adjusted position
        setDropdownStyle({
          position: 'fixed',
          top: `${adjustedY}px`,
          left: `${adjustedX}px`,
          zIndex: 1000,
          visibility: 'visible' // Now make it visible
        });
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [position, actions, isOpen, calculateAdjustedPosition]); // Recalculate when position or actions change

  // Early return if conditions aren't met
  if (!isOpen || !position || actions.length === 0) {
    return null;
  }
  
  return (
    <div
      ref={dropdownRef}
      className="bg-white rounded-md shadow-lg border border-gray-200 min-w-[180px]"
      style={dropdownStyle}
    >
      <div className="py-1">
        {sortedActions.map((action) => (
          <ActionButton key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
});

// Display name for debugging
TableActionDropdown.displayName = 'TableActionDropdown';

export default TableActionDropdown;
