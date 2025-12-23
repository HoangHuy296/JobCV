import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { userService, type User } from '../../../api/userService';
import { roleService, type Role } from '../../../api/roleService';
import { uploadMedia } from '../../../api/mediaService';
import { toast } from 'react-toastify';
import { DataManagement } from '../../../components';
import SelectWithSearch from '../../../components/common/SelectWithSearch';

const UserManagementRefactored: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function for users only
  const fetchUsers = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setStatusFilter('all');
        setRoleFilter('all');
        page = 1;
      }
      
      const usersResponse = await userService.getAllUsers(
        page, 
        limit ?? pagination.limit, 
        reset ? '' : searchTerm, 
        reset || statusFilter === 'all' ? undefined : statusFilter,
        reset || roleFilter === 'all' ? undefined : roleFilter
      );
    
      setUsers(usersResponse.users);
      setPagination(usersResponse.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, statusFilter, roleFilter]);

  // Function to fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const rolesResponse = await roleService.getAllRoles();
      setRoles(rolesResponse.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return pagination.totalPages > 1
      ? {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: fetchUsers,
          onItemsPerPageChange: (newLimit: number) => {
            setPagination(prev => ({ ...prev, limit: newLimit }));
            fetchUsers(1, false, newLimit);
          }
        }
      : undefined;
  }, [currentPage, pagination, fetchUsers]);

  // Load users on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setStatusFilter('all');
    fetchUsers(1);
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Handle search term changes
  useEffect(() => {
    // Reset to first page when search term changes
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<User | null> => {
    try {
      // Handle image upload if a file is provided
      let imageId: number | undefined;
      if (values.image && values.image instanceof File) {
        try {
          const mediaResponse = await uploadMedia(values.image);
          imageId = mediaResponse.id;
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      } else if (typeof values.image === 'number') {
        imageId = values.image;
      }
      
      // Ensure is_active is a boolean
      const isActive = values.is_active === true || 
                      (typeof values.is_active === 'number' && values.is_active === 1) || 
                      (typeof values.is_active === 'string' && values.is_active === '1');
      
      // Get role_id - could be a number or an array with a single value
      let roleId = values.role_id;
      if (Array.isArray(roleId) && roleId.length > 0) {
        roleId = roleId[0]; // Take the first value if it's an array
      }
      
      const createdUser = await userService.createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role_id: roleId, // Already a number, no need to parse
        is_active: isActive,
        image_id: imageId
      });

      if (createdUser) {
        toast.success('Tạo người dùng mới thành công');
        // Return the created user for edit mode
        return createdUser;
      }
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }, [fetchUsers]);

  const handleEdit = useCallback(async (user: User) => {
    try {
      // Handle image upload if a file is provided
      let imageId: number | undefined = user.image?.id ? user.image.id : undefined;
      if ((user as any).image && (user as any).image instanceof File) {
        try {
          const mediaResponse = await uploadMedia((user as any).image);
          imageId = mediaResponse.id;
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      } else if (typeof (user as any).image === 'number') {
        imageId = (user as any).image;
      }
      
      // Ensure is_active is a boolean
      const isActive = user.is_active === true || 
                      (typeof user.is_active === 'number' && user.is_active === 1) || 
                      (typeof user.is_active === 'string' && user.is_active === '1');
      
      // Get role_id - could be a number or an array with a single value
      let roleId = user.role_id;
      if (Array.isArray(roleId) && roleId.length > 0) {
        roleId = roleId[0]; // Take the first value if it's an array
      }
      
      const resp = await userService.updateUser(user.id, {
        name: user.name,
        email: user.email,
        role_id: roleId,
        is_active: isActive,
        image_id: imageId
      });

      if (resp) {
        toast.success('Cập nhật người dùng thành công');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, [fetchUsers]);

  const handleDelete = useCallback(async (user: User) => {
    try {
      const resp = await userService.deleteUser(user.id);
      if (resp) {
        toast.success('Xóa người dùng thành công');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }, [fetchUsers]);

  const handleSetActive = useCallback(async (user: User, isActive: boolean) => {
    try {
      const resp = await userService.setUserActiveStatus(user.id, { is_active: isActive });
      if (resp) {
        toast.success(`Người dùng đã được ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error setting user active status:', error);
      toast.error(`Lỗi khi ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`);
    }
  }, [fetchUsers]);

  // Role name translation mapping
  const translateRoleName = (roleName: string): string => {
    const roleTranslations: Record<string, string> = {
      'admin': 'Quản trị viên',
      'user': 'Người dùng',
      'recruiter': 'Nhà tuyển dụng'
    };
    return roleTranslations[roleName] || roleName;
  };

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { 
      key: 'image' as keyof User, 
      title: 'Ảnh đại diện',
      render: (_value: any, record: User) => record.image ? (
        <img src={record.image.url} alt={record.name} className="h-10 w-10 object-contain rounded-full" />
      ) : (
        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xs">Không có</span>
        </div>
      )
    },
    { key: 'name' as keyof User, title: 'Tên' },
    { key: 'email' as keyof User, title: 'Email' },
    { 
      key: 'role_id' as keyof User, 
      title: 'Vai trò',
      render: (value: number) => {
        const role = roles.find(r => r.id === value);
        return role ? translateRoleName(role.name) : 'N/A';
      }
    },
    { 
      key: 'is_active' as keyof User, 
      title: 'Trạng thái',
      render: (value: boolean) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Kích hoạt' : 'Vô hiệu'}
        </span>
      )
    }
  ], [roles]);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'image', 
      label: 'Ảnh đại diện', 
      type: 'image' as const
    },
    { 
      name: 'name', 
      label: 'Tên', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập tên' 
    },
    { 
      name: 'email', 
      label: 'Email', 
      type: 'email' as const, 
      required: true, 
      placeholder: 'Nhập email' 
    },
    { 
      name: 'password', 
      label: 'Mật khẩu', 
      type: 'password' as const, 
      required: false, 
      placeholder: 'Nhập mật khẩu' 
    },
    { 
      name: 'role_id', 
      label: 'Vai trò', 
      type: 'select' as const, 
      required: true,
      multiple: false,
      options: roles.map(role => ({ value: role.id, label: translateRoleName(role.name) }))
    },
    { 
      name: 'is_active', 
      label: 'Kích hoạt tài khoản', 
      type: 'checkbox' as const
    },
  ], [roles, translateRoleName]);

  // Status options for SelectWithSearch
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    { value: 1, label: 'Kích hoạt' },
    { value: 0, label: 'Vô hiệu' }
  ], []);

  // Role options for SelectWithSearch
  const roleOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả vai trò' },
    ...roles.map(role => ({
      value: role.id, // Use number directly to be consistent with form fields
      label: translateRoleName(role.name)
    }))
  ], [roles, translateRoleName]);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((selectedValues: any[]) => {
    setStatusFilter(selectedValues.length > 0 ? selectedValues[0] : 'all');
  }, []);

  // Handle role filter change
  const handleRoleFilterChange = useCallback((selectedValues: any[]) => {
    setRoleFilter(selectedValues.length > 0 ? selectedValues[0] : 'all');
  }, []);

  // Memoized additional filters to prevent recreation on each render
  const additionalFilters = useMemo(() => (
    <>
      <div className='w-full md:w-64'>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Trạng thái
        </label>
        <SelectWithSearch
          options={statusOptions}
          selectedValues={[statusFilter]}
          onChange={handleStatusFilterChange}
          placeholder="Chọn trạng thái"
          multiple={false}
          clearable={true}
        />
      </div>
      
      <div className='w-full md:w-64'>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Vai trò
        </label>
        <SelectWithSearch
          options={roleOptions}
          selectedValues={[roleFilter]}
          onChange={handleRoleFilterChange}
          placeholder="Chọn vai trò"
          multiple={false}
          clearable={true}
        />
      </div>
    </>
  ), [statusFilter, roleFilter, roles]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchUsers(currentPage, false)
  }), [searchTerm, additionalFilters]);

  return (
    <DataManagement<User>
      title="Quản lý người dùng"
      data={users}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={() => fetchUsers(1, true)}
      pagination={paginationData}
      filters={filterData}
      action={{
        additionalActions: (user: User) => [
          {
            label: user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt',
            icon: user.is_active 
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            onClick: () => handleSetActive(user, !user.is_active),
            className: user.is_active 
              ? 'text-red-600 hover:text-red-900 cursor-pointer' 
              : 'text-green-600 hover:text-green-900 cursor-pointer',
            type: user.is_active ? 'delete' : 'default'
          }
        ]
      }}
    />
  );
};

export default UserManagementRefactored;
