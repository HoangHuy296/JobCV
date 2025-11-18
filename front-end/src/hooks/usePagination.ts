import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsePaginationReturn {
  pagination: PaginationState;
  currentPage: number;
  setPagination: (pagination: PaginationState) => void;
  setCurrentPage: (page: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
}

/**
 * Custom hook for managing pagination state
 * Reduces boilerplate and improves performance
 */
export function usePagination(initialLimit: number = 10): UsePaginationReturn {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pagination.totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const resetPagination = useCallback(() => {
    setPagination({
      page: 1,
      limit: initialLimit,
      total: 0,
      totalPages: 0
    });
    setCurrentPage(1);
  }, [initialLimit]);

  return {
    pagination,
    currentPage,
    setPagination,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    resetPagination
  };
}
