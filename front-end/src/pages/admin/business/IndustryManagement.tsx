import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createIndustry, updateIndustry, deleteIndustry, type Industry } from '../../../api/industryService';
import { toast } from 'react-toastify';
import DataManagement from '../../../components/core/DataManagement';
import { useIndustryContext } from '../../../contexts/IndustryContext';

const IndustryManagement: React.FC = () => {
  const { industries, loading, refreshIndustries } = useIndustryContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // For pagination, we'll filter and paginate the industries from context
  const [filteredIndustries, setFilteredIndustries] = useState<Industry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filter industries based on search term - only when filter button is clicked
  const applyFilter = useCallback(() => {
    if (!industries || industries.length === 0) return;
    
    const filtered = industries.filter(industry => 
      industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (industry.description && industry.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setFilteredIndustries(paginated);
    setPagination({
      ...pagination,
      total,
      totalPages
    });
  }, [industries, searchTerm, currentPage, pagination.limit]);

  // Initial load - show all industries
  useEffect(() => {
    if (!industries || industries.length === 0) return;
    
    const total = industries.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = industries.slice(startIndex, endIndex);
    
    setFilteredIndustries(paginated);
    setPagination({
      ...pagination,
      total,
      totalPages
    });
  }, [industries, currentPage, pagination.limit]);

  // Load data on component mount
  const hasFetchedData = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRefresh = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    refreshIndustries();
  }, [refreshIndustries]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<Industry | null> => {
    try {
      const createdIndustry = await createIndustry({
        name: values.name,
        description: values.description
      });

      if (createdIndustry) {
        toast.success('Tạo ngành nghề mới thành công');
        // Return the created industry for edit mode
        return createdIndustry;
      }
      return null;
    } catch (error) {
      console.error('Error creating industry:', error);
      return null;
    }
  }, [handleRefresh]);

  const handleEdit = useCallback(async (industry: Industry) => {
    try {
      const resp = await updateIndustry(industry.id, {
        name: industry.name,
        description: industry.description
      });

      if (resp) {
        toast.success('Cập nhật ngành nghề thành công');
        handleRefresh(); // Refresh the industries and clear search term
      }
    } catch (error) {
      console.error('Error updating industry:', error);
    }
  }, [handleRefresh]);

  const handleDelete = useCallback(async (industry: Industry) => {
    try {
      const resp = await deleteIndustry(industry.id);
      if (resp) {
        toast.success('Xóa ngành nghề thành công');
        handleRefresh(); // Refresh the industries and clear search term
      }
    } catch (error) {
      console.error('Error deleting industry:', error);
    }
  }, [handleRefresh]);

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { key: 'name' as keyof Industry, title: 'Tên ngành nghề' },
    { 
      key: 'description' as keyof Industry, 
      title: 'Mô tả',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value || 'N/A'}
        </div>
      )
    },
    { key: 'created_at' as keyof Industry, title: 'Ngày tạo', render: (value: string) => new Date(value).toLocaleDateString('vi-VN') }
  ], []);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'name', 
      label: 'Tên ngành nghề', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập tên ngành nghề' 
    },
    { 
      name: 'description', 
      label: 'Mô tả', 
      type: 'textarea' as const,
      placeholder: 'Nhập mô tả ngành nghề' 
    }
  ], []);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters: null,
    onFilter: applyFilter
  }), [searchTerm, applyFilter]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return {
      currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      onPageChange: setCurrentPage,
      onItemsPerPageChange: (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit }));
        setCurrentPage(1);
      }
    };
  }, [currentPage, pagination]);

  return (
    <DataManagement<Industry>
      title="Quản lý ngành nghề"
      data={filteredIndustries}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={handleRefresh}
      pagination={paginationData}
      filters={filterData}
    />
  );
};

export default IndustryManagement;
