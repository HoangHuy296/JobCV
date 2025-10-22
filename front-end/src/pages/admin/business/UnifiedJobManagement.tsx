import React, { useState } from 'react';
import JobManagement from './JobManagement';
import JobReviewManagement from './JobReviewManagement';
import { LuLayoutGrid, LuClipboardCheck } from 'react-icons/lu';

const UnifiedJobManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'management' | 'review'>('management');

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Chế độ xem:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('management')}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'management'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LuLayoutGrid className="w-4 h-4" />
              Quản lý công việc
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'review'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LuClipboardCheck className="w-4 h-4" />
              Duyệt công việc
            </button>
          </div>
        </div>
      </div>

      {/* Render the selected view */}
      <div>
        {viewMode === 'management' ? <JobManagement /> : <JobReviewManagement />}
      </div>
    </div>
  );
};

export default UnifiedJobManagement;
