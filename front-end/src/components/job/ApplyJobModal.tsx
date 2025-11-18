import React, { useState, useEffect } from 'react';
import { applyForJob } from '../../api/jobApplicationService';
import { toast } from 'react-toastify';
import { LuX, LuFileText, LuSend, LuLoader } from 'react-icons/lu';
import apiClient from '../../api';

interface CV {
  id: number;
  title: string;
  file_name: string;
  created_at: string;
}

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle: string;
  companyName: string;
  onSuccess?: () => void;
}

const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  onSuccess
}) => {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCvs, setLoadingCvs] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserCvs();
    }
  }, [isOpen]);

  const fetchUserCvs = async () => {
    try {
      setLoadingCvs(true);
      const response = await apiClient.get('/cvs/my-cvs');
      const userCvs = response.data.result || [];
      setCvs(userCvs);
      
      // Auto-select first CV if available
      if (userCvs.length > 0) {
        setSelectedCvId(userCvs[0].id);
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Lỗi khi tải danh sách CV');
    } finally {
      setLoadingCvs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCvId) {
      toast.error('Vui lòng chọn CV để ứng tuyển');
      return;
    }

    try {
      setLoading(true);
      await applyForJob({
        job_id: jobId,
        cv_id: selectedCvId,
        cover_letter: coverLetter || undefined
      });

      toast.success('Ứng tuyển thành công!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Error applying for job:', error);
      // Error message is handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCvId(null);
    setCoverLetter('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ứng tuyển công việc</h2>
            <p className="text-sm text-gray-600 mt-1">
              {jobTitle} - {companyName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            disabled={loading}
          >
            <LuX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CV Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn CV <span className="text-red-500">*</span>
            </label>
            {loadingCvs ? (
              <div className="flex items-center justify-center py-8">
                <LuLoader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : cvs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <LuFileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Bạn chưa có CV nào</p>
                <a
                  href="/cv/tao-cv"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tạo CV ngay
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {cvs.map((cv) => (
                  <label
                    key={cv.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCvId === cv.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cv"
                      value={cv.id}
                      checked={selectedCvId === cv.id}
                      onChange={() => setSelectedCvId(cv.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <LuFileText className="w-5 h-5 text-gray-600" />
                        <p className="font-medium text-gray-900">{cv.title}</p>
                      </div>
                      {cv.file_name && (
                        <p className="text-sm text-gray-500 mt-1">{cv.file_name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Tạo ngày: {new Date(cv.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thư xin việc (không bắt buộc)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối đa 1000 ký tự
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCvId || loadingCvs}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LuLoader className="w-5 h-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <LuSend className="w-5 h-5" />
                  Gửi hồ sơ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobModal;
