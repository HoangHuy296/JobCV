import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { 
  getCampaigns, 
  createCampaign, 
  updateCampaign, 
  deleteCampaign,
  type Campaign 
} from '../../../api/campaignService';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/dateUtils';
import { DataManagement } from '../../../components';

const CampaignManagement: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      const data = await getCampaigns(company.id);
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Lỗi khi tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    if (company?.id) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, company?.id]);

  // Handle create
  const handleCreate = useCallback(async (values: Record<string, any>) => {
    if (!company?.id) return null;
    
    try {
      setLoading(true);
      const campaignData = {
        name: values.name,
        description: values.description || '',
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        status: values.status || 'draft',
        company_id: company.id
      };
      
      const created = await createCampaign(campaignData);
      
      if (created) {
        toast.success('Tạo chiến dịch thành công');
        fetchCampaigns();
        return created;
      }
      return null;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Lỗi khi tạo chiến dịch');
      setLoading(false);
      return null;
    }
  }, [company?.id, fetchCampaigns]);

  // Handle edit
  const handleEdit = useCallback(async (updated: Campaign) => {
    try {
      setLoading(true);
      const campaignData = {
        name: updated.name,
        description: updated.description,
        start_date: updated.start_date,
        end_date: updated.end_date,
        status: updated.status
      };
      
      await updateCampaign(updated.id, campaignData);
      toast.success('Cập nhật chiến dịch thành công');
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Lỗi khi cập nhật chiến dịch');
      setLoading(false);
    }
  }, [fetchCampaigns]);

  // Handle delete
  const handleDelete = async (record: Campaign) => {
    try {
      setLoading(true);
      await deleteCampaign(record.id);
      toast.success('Xóa chiến dịch thành công');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Lỗi khi xóa chiến dịch');
      setLoading(false);
    }
  };

  // Handle view campaign details
  const handleViewCampaign = useCallback((campaign: Campaign) => {
    navigate(`/nha-tuyen-dung/chien-dich/${campaign.id}`);
  }, [navigate]);

  // Status badge
  const getStatusBadge = useCallback((status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bản nháp' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang hoạt động' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tạm dừng' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Hoàn thành' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }, []);

  // Table columns
  const columns = useMemo(() => [
    { key: 'name' as keyof Campaign, title: 'Tên chiến dịch' },
    { key: 'description' as keyof Campaign, title: 'Mô tả' },
    {
      key: 'status' as keyof Campaign,
      title: 'Trạng thái',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'job_count' as keyof Campaign,
      title: 'Số tin tuyển dụng',
      render: (value: number) => value || 0
    },
    {
      key: 'start_date' as keyof Campaign,
      title: 'Ngày bắt đầu',
      render: (value: string) => value ? formatDate(value) : '-'
    },
    {
      key: 'end_date' as keyof Campaign,
      title: 'Ngày kết thúc',
      render: (value: string) => value ? formatDate(value) : '-'
    },
    {
      key: 'created_at' as keyof Campaign,
      title: 'Ngày tạo',
      render: (value: string) => formatDate(value)
    }
  ], [getStatusBadge]);

  // Form fields
  const formFields = useMemo(() => [
    {
      name: 'name',
      label: 'Tên chiến dịch',
      type: 'text' as const,
      required: true,
      placeholder: 'Nhập tên chiến dịch'
    },
    {
      name: 'description',
      label: 'Mô tả',
      type: 'textarea' as const,
      placeholder: 'Nhập mô tả chiến dịch'
    },
    {
      name: 'start_date',
      label: 'Ngày bắt đầu',
      type: 'datetime' as const
    },
    {
      name: 'end_date',
      label: 'Ngày kết thúc',
      type: 'datetime' as const
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select' as const,
      options: [
        { value: 'draft', label: 'Bản nháp' },
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'paused', label: 'Tạm dừng' },
        { value: 'completed', label: 'Hoàn thành' }
      ],
      defaultValue: 'draft'
    }
  ], []);

  // Check if company exists
  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin công ty</h2>
          <p className="text-gray-600 mb-6">Vui lòng tạo công ty trước khi quản lý chiến dịch.</p>
          <button 
            onClick={() => navigate('/nha-tuyen-dung/bang-dieu-khien')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Quay lại bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataManagement<Campaign>
      title="Quản lý chiến dịch tuyển dụng"
      data={campaigns}
      columns={columns}
      formFields={formFields}
      loading={loading}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={fetchCampaigns}
      action={{
        additionalActions: (campaign: Campaign) => [
          {
            label: 'Xem chi tiết',
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            onClick: () => handleViewCampaign(campaign),
            className: 'text-blue-600 hover:text-blue-800 cursor-pointer',
            type: 'default'
          }
        ]
      }}
    />
  );
};

export default CampaignManagement;
