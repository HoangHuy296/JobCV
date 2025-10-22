import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

// Define the structure for action items
export interface TableAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  type?: 'add' | 'delete' | 'default';
}

interface TableActionContextType {
  actions: TableAction[];
  setActions: (actions: TableAction[]) => void;
  clearActions: () => void;
  position: { x: number; y: number } | null;
  setPosition: (position: { x: number; y: number } | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const TableActionContext = createContext<TableActionContextType | undefined>(undefined);

interface TableActionProviderProps {
  children: ReactNode;
}

export const TableActionProvider: React.FC<TableActionProviderProps> = ({ children }) => {
  const [actions, setActions] = useState<TableAction[]>([]);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Memoize clearActions to prevent unnecessary re-renders
  const clearActions = useCallback(() => {
    setActions([]);
    setIsOpen(false);
    setPosition(null);
  }, []);
  
  // Memoize setActions to prevent unnecessary re-renders
  const memoizedSetActions = useCallback((newActions: TableAction[]) => {
    setActions(newActions);
  }, []);
  
  // Memoize setPosition to prevent unnecessary re-renders
  const memoizedSetPosition = useCallback((newPosition: { x: number; y: number } | null) => {
    setPosition(newPosition);
  }, []);
  
  // Memoize setIsOpen to prevent unnecessary re-renders
  const memoizedSetIsOpen = useCallback((newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    actions,
    setActions: memoizedSetActions,
    clearActions,
    position,
    setPosition: memoizedSetPosition,
    isOpen,
    setIsOpen: memoizedSetIsOpen,
  }), [actions, memoizedSetActions, clearActions, position, memoizedSetPosition, isOpen, memoizedSetIsOpen]);

  return (
    <TableActionContext.Provider value={contextValue}>
      {children}
    </TableActionContext.Provider>
  );
};

export const useTableAction = (): TableActionContextType => {
  const context = useContext(TableActionContext);
  if (context === undefined) {
    throw new Error('useTableAction must be used within a TableActionProvider');
  }
  return context;
};
