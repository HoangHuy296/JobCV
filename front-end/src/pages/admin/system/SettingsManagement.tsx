import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { settingService, type Setting } from '../../../api/settingService';
import { toast } from 'react-toastify';
import DataManagement from '../../../components/core/DataManagement';
import SelectWithSearch from '../../../components/common/SelectWithSearch';

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async (page: number = 1, reset: boolean = false, limit?: number) => {
    try {
      setLoading(true);
      
      // Reset filters and pagination if requested
      if (reset) {
        setSearchTerm('');
        setGroupFilter('all');
        page = 1;
      }
      
      const settingsResponse = await settingService.getAllSettings(
        page, 
        limit ?? pagination.limit, 
        reset || groupFilter === 'all' ? '' : groupFilter,
        reset ? '' : searchTerm
      );

      setSettings(settingsResponse.settings);
      setPagination(settingsResponse.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, groupFilter, searchTerm]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    return {
      currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      onPageChange: fetchData,
      onItemsPerPageChange: (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchData(1, false, newLimit);
      }
    };
  }, [currentPage, pagination, fetchData]);

  // Load data on component mount
  useEffect(() => {
    // Prevent duplicate calls in development due to React Strict Mode
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    
    // Reset filters and search terms on component mount
    setSearchTerm('');
    setGroupFilter('all');
    fetchData(1);
  }, [fetchData]);

  // Handle search term and group filter changes
  useEffect(() => {
    // Reset to first page when filters change
    if (searchTerm !== '' || groupFilter !== 'all') {
      setCurrentPage(1);
    }
  }, [searchTerm, groupFilter]);

  const handleCreate = useCallback(async (values: Record<string, any>): Promise<Setting | null> => {
    try {
      const settingData = {
        key: values.setting_key,
        value: values.setting_value,
        group: values.setting_group,
        description: values.description
      };
      
      const createdSetting = await settingService.createOrUpdateSetting(settingData);

      if (createdSetting) {
        toast.success('Tạo cài đặt mới thành công');
        fetchData();
        return createdSetting;
      }
      return null;
    } catch (error) {
      console.error('Error creating setting:', error);
      return null;
    }
  }, [fetchData]);

  const handleEdit = useCallback(async (setting: Setting): Promise<void> => {
    try {
      const settingData = {
        key: setting.setting_key,
        value: setting.setting_value,
        group: setting.setting_group,
        description: setting.description
      };
      
      const updatedSetting = await settingService.createOrUpdateSetting(settingData);

      if (updatedSetting) {
        toast.success('Cập nhật cài đặt thành công');
        fetchData();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }, [fetchData]);

  const handleDelete = useCallback(async (setting: Setting) => {
    try {
      const resp = await settingService.deleteSetting(setting.setting_key, setting.setting_group);
      
      if (resp) {
        toast.success('Xóa cài đặt thành công');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
    }
  }, [fetchData]);

  // Memoized columns to prevent recreation on each render
  const columns = useMemo(() => [
    { key: 'setting_key' as keyof Setting, title: 'Khóa' },
    { key: 'setting_value' as keyof Setting, title: 'Giá trị' },
    { key: 'setting_group' as keyof Setting, title: 'Nhóm' },
    { 
      key: 'description' as keyof Setting, 
      title: 'Mô tả',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value || 'N/A'}
        </div>
      )
    }
  ], []);

  // Memoized form fields to prevent recreation on each render
  const formFields = useMemo(() => [
    { 
      name: 'setting_key', 
      label: 'Khóa', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập khóa cài đặt' 
    },
    { 
      name: 'setting_value', 
      label: 'Giá trị', 
      type: 'text' as const, 
      required: true, 
      placeholder: 'Nhập giá trị cài đặt' 
    },
    { 
      name: 'setting_group', 
      label: 'Nhóm', 
      type: 'text' as const, 
      required: true,
      placeholder: 'Nhập nhóm cài đặt' 
    },
    { 
      name: 'description', 
      label: 'Mô tả', 
      type: 'textarea' as const,
      placeholder: 'Nhập mô tả cài đặt' 
    }
  ], []);

  // Group options for SelectWithSearch
  const groupOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    { value: 'DOMAIN', label: 'DOMAIN' },
    { value: 'SYSTEM', label: 'SYSTEM' },
    { value: 'REPORT', label: 'REPORT' },
    { value: 'EMAIL', label: 'EMAIL' },
    { value: 'EMAIL_TEMPLATE', label: 'EMAIL_TEMPLATE' },
  ], []);

  // Handle group filter change
  const handleGroupFilterChange = useCallback((selectedValues: any[]) => {
    // Take the first value or default to 'all'
    setGroupFilter(selectedValues.length > 0 ? selectedValues[0] : 'all');
  }, []);

  // Memoized additional filters to prevent recreation on each render
  const additionalFilters = useMemo(() => (
    <div className="w-full md:w-64">
      <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
        Nhóm
      </label>
      <SelectWithSearch
        options={groupOptions}
        selectedValues={[groupFilter]}
        onChange={handleGroupFilterChange}
        placeholder="Chọn nhóm"
        multiple={false}
        clearable={true}
      />
    </div>
  ), [groupFilter, groupOptions, handleGroupFilterChange]);

  // Memoized filter data
  const filterData = useMemo(() => ({
    searchTerm,
    onSearchChange: setSearchTerm,
    additionalFilters,
    onFilter: () => fetchData(currentPage, false)
  }), [searchTerm, additionalFilters, currentPage, fetchData])

  return (
    <DataManagement<Setting>
      title="Quản lý cài đặt"
      data={settings}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={() => fetchData(1, true)}
      pagination={paginationData}
      filters={filterData}
    />
  );
};

export default SettingsManagement;
