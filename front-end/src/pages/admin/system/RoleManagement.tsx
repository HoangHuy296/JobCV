import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { roleService, type Role, type RoleInput } from '../../../api/roleService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import SelectWithSearch from '../../../components/common/SelectWithSearch';

const RoleManagementRefactored: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function with useCallback
  const fetchRoles = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setTypeFilter('all');
        page = 1;
      }
      
      // Combine search term and type filter if needed
      let searchQuery = reset ? '' : searchTerm;
      if (!reset && typeFilter !== 'all') {
        searchQuery = searchQuery ? `${searchQuery} type:${typeFilter}` : `type:${typeFilter}`;
      }
      
      const response = await roleService.getAllRoles(
        page, 
        limit ?? pagination.limit, 
        searchQuery
      );
      
      setRoles(response.roles);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, typeFilter]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchRoles,
          onItemsPerPageChange: (newLimit: number) => {
            setPagination(prev => ({ ...prev, limit: newLimit }));
            fetchRoles(1, false, newLimit);
          }
        }
      : undefined;
  }, [currentPage, pagination, fetchRoles]);

  // Load roles on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setTypeFilter('all');
    fetchRoles(1);
  }, [fetchRoles]);

  // Handle search term and filter changes
  useEffect(() => {
    // Reset to first page when search term or filter changes
    if (searchTerm !== '' || typeFilter !== 'all') {
      setCurrentPage(1);
    }
  }, [searchTerm, typeFilter]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<Role | null> => {
    try {
      const roleInput: RoleInput = {
        name: values.name,
        description: values.description
      };

      const createdRole = await roleService.createRole(roleInput);

      if (createdRole) {
        toast.success('Tạo vai trò mới thành công');
        // Return the created role for edit mode
        return createdRole;
      }
      return null;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }, [fetchRoles]);

  const handleEdit = useCallback(async (role: Role) => {
    try {
      const roleInput: RoleInput = {
        name: role.name,
        description: role.description
      };
      const resp = await roleService.updateRole(role.id, roleInput);

      if (resp) {
        toast.success('Cập nhật vai trò thành công');
        fetchRoles();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }, [fetchRoles]);

  const handleDelete = useCallback(async (role: Role) => {
    try {
      const resp = await roleService.deleteRole(role.id);
      
      if (resp) {
        toast.success('Xóa vai trò thành công');
        fetchRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  }, [fetchRoles]);

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { key: 'name' as keyof Role, title: 'Tên vai trò' },
    { key: 'description' as keyof Role, title: 'Mô tả' }
  ], []);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'name', 
      label: 'Tên vai trò', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập tên vai trò' 
    },
    { 
      name: 'description', 
      label: 'Mô tả', 
      type: 'textarea' as const, 
      placeholder: 'Nhập mô tả vai trò' 
    }
  ], []);

  // Type options for SelectWithSearch
  const typeOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'user', label: 'Người dùng' },
    { value: 'recruiter', label: 'Nhà tuyển dụng' }
  ], []);

  // Handle type filter change
  const handleTypeFilterChange = useCallback((selectedValues: any[]) => {
    setTypeFilter(selectedValues.length > 0 ? selectedValues[0] : 'all');
  }, []);

  // Memoized additional filters
  const additionalFilters = useMemo(() => (
    <div className='w-full md:w-64'>
      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
        Loại vai trò
      </label>
      <SelectWithSearch
        options={typeOptions}
        selectedValues={[typeFilter]}
        onChange={handleTypeFilterChange}
        placeholder="Chọn loại vai trò"
        multiple={false}
        clearable={true}
      />
    </div>
  ), [typeFilter, typeOptions, handleTypeFilterChange]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchRoles(currentPage, false)
  }), [searchTerm, additionalFilters, currentPage, fetchRoles]);

  return (
    <DataManagement<Role>
      title="Quản lý vai trò"
      data={roles}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={() => fetchRoles(1, true)}
      pagination={paginationData}
      filters={filterData}
    />
  );
};

export default RoleManagementRefactored;
