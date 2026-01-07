import React, { useState, useEffect, useCallback } from 'react';
import * as aiService from '../../../api/aiService';
import type { AIPrompt, AIProcess } from '../../../api/aiService';
import * as apiKeyService from '../../../api/apiKeyService';
import type { APIKey, APIKeyCreate, APIKeyUpdate, UsageStats } from '../../../api/apiKeyService';
import { toast } from 'react-toastify';
import DataManagement from '../../../components/core/DataManagement';
import type { FormField } from '../../../components/common/SlideOver';
import SelectWithSearch from '../../../components/common/SelectWithSearch';

const AISettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keys' | 'prompts' | 'processes'>('keys');
  const [loading, setLoading] = useState(true);
  
  // Prompts
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  // Processes
  const [processes, setProcesses] = useState<AIProcess[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<AIProcess | null>(null);
  const [selectedPromptForAssign, setSelectedPromptForAssign] = useState<number[]>([]);
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [stats, setStats] = useState<UsageStats[]>([]);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoadingPrompts(true);
      const data = await aiService.getAllPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Không thể tải danh sách prompts');
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      setLoadingProcesses(true);
      const data = await aiService.getAllProcesses();
      setProcesses(data);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Không thể tải danh sách processes');
    } finally {
      setLoadingProcesses(false);
    }
  }, []);

  const fetchAPIKeys = useCallback(async () => {
    try {
      setLoadingKeys(true);
      const response = await apiKeyService.getAllAPIKeys();
      setApiKeys(response.result || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiKeyService.getUsageStats();
      setStats(response.result || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPrompts(),
      fetchProcesses(),
      fetchAPIKeys(),
      fetchStats()
    ]).finally(() => setLoading(false));
  }, [fetchPrompts, fetchProcesses, fetchAPIKeys, fetchStats]);

  // Prompt handlers
  const handleCreatePrompt = async (values: Record<string, any>) => {
    try {
      await aiService.createPrompt({
        name: values.name,
        filename: values.filename,
        description: values.description,
        category: values.category,
        variables: values.variables ? JSON.parse(values.variables) : [],
        content: values.content
      });
      toast.success('Tạo prompt thành công');
      await fetchPrompts();
      return null;
    } catch (error: any) {
      return null;
    }
  };

  const handleUpdatePrompt = async (prompt: AIPrompt, values: Record<string, any>) => {
    try {
      await aiService.updatePrompt(prompt.id, {
        name: values.name,
        description: values.description,
        category: values.category,
        variables: values.variables ? JSON.parse(values.variables) : [],
        content: values.content
      });
      toast.success('Cập nhật prompt thành công');
      await fetchPrompts();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleDeletePrompt = async (prompt: AIPrompt) => {
    try {
      await aiService.deletePrompt(prompt.id);
      toast.success('Xóa prompt thành công');
      await fetchPrompts();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  // Process handlers
  const handleCreateProcess = async (values: Record<string, any>) => {
    try {
      // Build config object from model and temperature fields
      const config: any = {};
      if (values.model) {
        config.model = values.model;
      }
      if (values.temperature !== undefined && values.temperature !== '') {
        config.temperature = parseFloat(values.temperature);
      }
      
      await aiService.createProcess({
        name: values.name,
        code: values.code,
        description: values.description,
        prompt_id: values.prompt_id ? parseInt(values.prompt_id) : undefined,
        is_active: values.is_active === 'true',
        config: config
      });
      toast.success('Tạo process thành công');
      await fetchProcesses();
      return null;
    } catch (error: any) {
      return null;
    }
  };

  const handleUpdateProcess = async (process: AIProcess, values: Record<string, any>) => {
    try {
      // Build config object from model and temperature fields
      const config: any = {};
      if (values.model) {
        config.model = values.model;
      }
      if (values.temperature !== undefined && values.temperature !== '') {
        config.temperature = parseFloat(values.temperature);
      }
      
      await aiService.updateProcess(process.id, {
        name: values.name,
        description: values.description,
        prompt_id: values.prompt_id ? parseInt(values.prompt_id) : undefined,
        is_active: values.is_active === 'true',
        config: config
      });
      toast.success('Cập nhật process thành công');
      await fetchProcesses();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleDeleteProcess = async (process: AIProcess) => {
    try {
      await aiService.deleteProcess(process.id);
      toast.success('Xóa process thành công');
      await fetchProcesses();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleToggleProcessActive = async (process: AIProcess) => {
    try {
      await aiService.toggleProcessActive(process.id);
      toast.success(`${process.is_active ? 'Tắt' : 'Bật'} process thành công`);
      await fetchProcesses();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleAssignPrompt = async () => {
    if (!selectedProcess) return;
    
    try {
      if (selectedPromptForAssign.length === 0) {
        toast.error('Vui lòng chọn prompt');
        return;
      }
      
      await aiService.assignPromptToProcess(selectedProcess.id, selectedPromptForAssign[0]);
      toast.success('Gán prompt thành công');
      setAssignModalOpen(false);
      setSelectedProcess(null);
      setSelectedPromptForAssign([]);
      await fetchProcesses();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  // API Key handlers
  const handleCreateAPIKey = async (values: Record<string, any>) => {
    try {
      const data: APIKeyCreate = {
        name: values.name,
        provider: values.provider || 'gemini',
        api_key: values.api_key,
        is_active: values.is_active === 'true',
        daily_limit: values.daily_limit ? parseInt(values.daily_limit) : 1500,
        priority: values.priority ? parseInt(values.priority) : 0,
        notes: values.notes
      };

      await apiKeyService.createAPIKey(data);
      toast.success('Tạo API key thành công');
      await fetchAPIKeys();
      await fetchStats();
      return null;
    } catch (error: any) {
      return null;
    }
  };

  const handleUpdateAPIKey = async (key: APIKey, values: Record<string, any>) => {
    try {
      const data: APIKeyUpdate = {
        name: values.name,
        is_active: values.is_active === 'true',
        daily_limit: values.daily_limit ? parseInt(values.daily_limit) : undefined,
        priority: values.priority ? parseInt(values.priority) : undefined,
        notes: values.notes
      };

      if (values.api_key && values.api_key.trim()) {
        data.api_key = values.api_key;
      }

      await apiKeyService.updateAPIKey(key.id, data);
      toast.success('Cập nhật API key thành công');
      await fetchAPIKeys();
      await fetchStats();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleDeleteAPIKey = async (key: APIKey) => {
    try {
      await apiKeyService.deleteAPIKey(key.id);
      toast.success('Xóa API key thành công');
      await fetchAPIKeys();
      await fetchStats();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  const handleToggleAPIKeyActive = async (key: APIKey) => {
    try {
      await apiKeyService.toggleAPIKeyActive(key.id);
      toast.success(`${key.is_active ? 'Tắt' : 'Bật'} API key thành công`);
      await fetchAPIKeys();
      await fetchStats();
    } catch (error: any) {
      // Error handled by interceptor
    }
  };

  // Form fields for prompts
  const promptFormFields: FormField[] = [
    { name: 'name', label: 'Tên Prompt', type: 'text', required: true },
    { name: 'filename', label: 'Tên File (*.txt)', type: 'text', required: true, placeholder: 'example-prompt.txt' },
    { name: 'description', label: 'Mô tả', type: 'textarea', rows: 3 },
    { name: 'category', label: 'Danh mục', type: 'text', placeholder: 'cv_processing, matching, generation...' },
    { name: 'variables', label: 'Variables (JSON array)', type: 'textarea', rows: 3, placeholder: '["cv_data", "job_data"]' },
    { name: 'content', label: 'Nội dung Prompt', type: 'textarea', required: true, rows: 10 }
  ];

  // Form fields for processes
  const processFormFields: FormField[] = [
    { name: 'name', label: 'Tên Process', type: 'text', required: true },
    { name: 'code', label: 'Mã Process', type: 'text', required: true, placeholder: 'CV_EXTRACTION' },
    { name: 'description', label: 'Mô tả', type: 'textarea', rows: 3 },
    { 
      name: 'prompt_id', 
      label: 'Prompt', 
      type: 'select',
      options: [
        ...prompts.map(p => ({ value: p.id.toString(), label: p.name }))
      ]
    },
    { 
      name: 'is_active', 
      label: 'Trạng thái', 
      type: 'select',
      options: [
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Tạm dừng' }
      ]
    },
    {
      name: 'model',
      label: 'Gemini Model',
      type: 'select',
      defaultValue: 'gemini-1.5-flash',
      options: [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Nhanh, tiết kiệm)' },
        { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B (Nhỏ gọn nhất)' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Chất lượng cao)' },
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Thử nghiệm)' }
      ],
      description: 'Chọn model Gemini sử dụng cho process này'
    },
    {
      name: 'temperature',
      label: 'Temperature',
      type: 'number',
      defaultValue: 0.1,
      placeholder: '0.1',
      description: 'Mức độ ngẫu nhiên (0.0 - 2.0). Thấp hơn = nhất quán hơn'
    }
  ];

  // Form fields for API keys
  const apiKeyFormFields: FormField[] = [
    { name: 'name', label: 'Tên Key', type: 'text', required: true },
    { 
      name: 'provider', 
      label: 'Provider', 
      type: 'select',
      defaultValue: 'gemini',
      options: [
        { value: 'gemini', label: 'Google Gemini' }
      ]
    },
    { 
      name: 'api_key', 
      label: 'API Key', 
      type: 'password', 
      required: true,
      placeholder: 'Nhập API key...',
      description: 'Để trống nếu không muốn thay đổi (khi edit)'
    },
    { 
      name: 'is_active', 
      label: 'Trạng thái', 
      type: 'select',
      defaultValue: 'true',
      options: [
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Tạm dừng' }
      ]
    },
    { 
      name: 'daily_limit', 
      label: 'Giới hạn hàng ngày', 
      type: 'number',
      defaultValue: 1500,
      placeholder: '1500',
      description: 'Số lượng requests tối đa mỗi ngày (0 = không giới hạn)'
    },
    { 
      name: 'priority', 
      label: 'Độ ưu tiên', 
      type: 'number',
      defaultValue: 0,
      placeholder: '0',
      description: 'Key có priority cao hơn sẽ được ưu tiên sử dụng'
    },
    { 
      name: 'notes', 
      label: 'Ghi chú', 
      type: 'textarea',
      rows: 3,
      placeholder: 'Ghi chú về key này...'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý AI</h1>
            <p className="text-purple-100">Cấu hình API, Prompts và AI Processes</p>
          </div>
          <div className="bg-white/20 rounded-full p-4">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('keys')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'keys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                API Keys ({apiKeys.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'prompts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Prompts ({prompts.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('processes')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'processes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                AI Processes ({processes.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {stats.map(stat => (
                    <div key={stat.provider} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
                      <div className="text-sm font-medium text-blue-600 uppercase">{stat.provider}</div>
                      <div className="mt-2 flex items-baseline">
                        <div className="text-3xl font-bold text-gray-900">{stat.active_keys}</div>
                        <div className="ml-2 text-sm text-gray-600">/ {stat.total_keys} keys</div>
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="text-xs text-gray-600">
                          Hôm nay: <span className="font-medium">{stat.total_daily_usage.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Tổng: <span className="font-medium">{stat.total_usage.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* API Keys Table */}
              <DataManagement
                title="API Keys"
                data={apiKeys}
                columns={[
                  { 
                    key: 'name' as keyof APIKey, 
                    title: 'Tên',
                    render: (value: any, record: APIKey) => (
                      <div>
                        <div className="font-medium text-gray-900">{value}</div>
                        <div className="text-xs text-gray-500">{record.api_key_preview}</div>
                      </div>
                    )
                  },
                  { 
                    key: 'provider' as keyof APIKey, 
                    title: 'Provider',
                    render: (value: any) => (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {value}
                      </span>
                    )
                  },
                  { 
                    key: 'is_active' as keyof APIKey, 
                    title: 'Trạng thái',
                    render: (value: any) => (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        value 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {value ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    )
                  },
                  { 
                    key: 'priority' as keyof APIKey, 
                    title: 'Ưu tiên',
                    render: (value: any) => (
                      <span className="font-medium text-gray-700">{value}</span>
                    )
                  },
                  { 
                    key: 'daily_usage' as keyof APIKey, 
                    title: 'Sử dụng hôm nay',
                    render: (value: any, record: APIKey) => {
                      const percentage = record.daily_limit > 0 
                        ? Math.round((value / record.daily_limit) * 100) 
                        : 0;
                      const isNearLimit = percentage >= 80;
                      
                      return (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {value} / {record.daily_limit === 0 ? '∞' : record.daily_limit}
                          </div>
                          {record.daily_limit > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  isNearLimit ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  },
                  { 
                    key: 'usage_count' as keyof APIKey, 
                    title: 'Tổng sử dụng',
                    render: (value: any) => (
                      <span className="text-gray-700">{value.toLocaleString()}</span>
                    )
                  }
                ]}
                formFields={apiKeyFormFields}
                loading={loadingKeys}
                onCreate={handleCreateAPIKey}
                onEdit={(key) => handleUpdateAPIKey(key, {})}
                onDelete={handleDeleteAPIKey}
                onRefresh={fetchAPIKeys}
                action={{
                  showAddAction: true,
                  showEditAction: true,
                  showDeleteAction: true,
                  additionalActions: (key) => [
                    {
                      label: key.is_active ? 'Tắt' : 'Bật',
                      icon: key.is_active ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ),
                      onClick: () => handleToggleAPIKeyActive(key),
                      className: key.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                    }
                  ]
                }}
              />

              {/* Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Hệ thống tự động chọn key tốt nhất dựa trên priority và usage</li>
                  <li>• Key có priority cao hơn sẽ được ưu tiên sử dụng trước</li>
                  <li>• Daily limit tự động reset mỗi ngày</li>
                  <li>• Khi key đạt limit, hệ thống tự động chuyển sang key khác</li>
                  <li>• Lấy Gemini API key tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <DataManagement
              title="Quản lý Prompts"
              data={prompts}
              columns={[
                { key: 'name', title: 'Tên' },
                { key: 'filename', title: 'File', render: (val) => <code className="text-sm bg-gray-100 px-2 py-1 rounded">{val}</code> },
                { key: 'category', title: 'Danh mục', render: (val) => <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{val}</span> },
                { key: 'description', title: 'Mô tả' }
              ]}
              formFields={promptFormFields}
              loading={loadingPrompts}
              onCreate={handleCreatePrompt}
              onEdit={(prompt) => handleUpdatePrompt(prompt, {})}
              onDelete={handleDeletePrompt}
              onRefresh={fetchPrompts}
            />
          )}

          {activeTab === 'processes' && (
            <DataManagement
              title="Quản lý AI Processes"
              data={processes}
              columns={[
                { key: 'name', title: 'Tên' },
                { key: 'code', title: 'Mã', render: (val) => <code className="text-sm bg-gray-100 px-2 py-1 rounded">{val}</code> },
                { 
                  key: 'config', 
                  title: 'Model', 
                  render: (val: any) => {
                    const config = typeof val === 'string' ? JSON.parse(val) : val;
                    return (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        {config?.model || 'gemini-1.5-flash'}
                      </span>
                    );
                  }
                },
                { 
                  key: 'is_active', 
                  title: 'Trạng thái', 
                  render: (val) => (
                    <span className={`px-2 py-1 text-xs rounded-full ${val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {val ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  )
                },
                { key: 'prompt_name', title: 'Prompt', render: (val) => val || <span className="text-gray-400">Chưa gán</span> }
              ]}
              formFields={processFormFields}
              loading={loadingProcesses}
              onCreate={handleCreateProcess}
              onEdit={(process) => {
                // Parse config to populate form fields
                const config = typeof process.config === 'string' ? JSON.parse(process.config) : process.config;
                const formValues = {
                  ...process,
                  model: config?.model || 'gemini-1.5-flash',
                  temperature: config?.temperature !== undefined ? config.temperature : 0.1
                };
                return handleUpdateProcess(process, formValues);
              }}
              onDelete={handleDeleteProcess}
              onRefresh={fetchProcesses}
              action={{
                showAddAction: true,
                showEditAction: true,
                showDeleteAction: true,
                additionalActions: (process) => [
                  {
                    label: process.is_active ? 'Tắt' : 'Bật',
                    icon: process.is_active ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ),
                    onClick: () => handleToggleProcessActive(process),
                    className: process.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                  },
                  {
                    label: 'Gán Prompt',
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ),
                    onClick: () => {
                      setSelectedProcess(process);
                      setAssignModalOpen(true);
                    },
                    className: 'text-purple-600 hover:text-purple-800'
                  }
                ]
              }}
            />
          )}
        </div>
      </div>

      {/* Assign Prompt Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => {
              setAssignModalOpen(false);
              setSelectedProcess(null);
              setSelectedPromptForAssign([]);
            }}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Gán Prompt cho Process</h3>
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedProcess(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Chọn prompt để gán cho process: <strong className="text-gray-900">{selectedProcess?.name}</strong>
              </p>
              <SelectWithSearch
                options={prompts.map(p => ({ value: p.id, label: `${p.name} (${p.filename})` }))}
                selectedValues={selectedPromptForAssign}
                onChange={setSelectedPromptForAssign}
                placeholder="-- Chọn prompt --"
                multiple={false}
                clearable={true}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedProcess(null);
                  setSelectedPromptForAssign([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignPrompt}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Gán Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettings;
