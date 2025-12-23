import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuLoader, LuArrowLeft, LuDownload, LuPrinter } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { getCVPreviewData } from '../../api/cvTemplateService';
import { downloadCV } from '../../api/cvService';

const CVPreview: React.FC = () => {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCVPreview = useCallback(async () => {
    if (!cvId) return;
    
    try {
      setLoading(true);
      const response = await getCVPreviewData(Number(cvId));
      setCvData(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error loading CV preview:', error);
      const errorMsg = error.response?.data?.message || 'Không thể tải CV';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted && cvId) {
        await loadCVPreview();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [loadCVPreview, cvId]);

  const handleDownload = useCallback(async () => {
    if (!cvId) return;
    
    try {
      const blob = await downloadCV(Number(cvId));
      
      // Check if response is actually a blob (not JSON error)
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const error = JSON.parse(text);
        toast.error(error.message || 'Không thể tải xuống CV');
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvData?.cv?.title || 'CV'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tải xuống CV thành công');
    } catch (error: any) {
      console.error('Error downloading CV:', error);
      toast.error(error.response?.data?.message || 'Không thể tải xuống CV');
    }
  }, [cvId, cvData]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LuLoader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải CV...</p>
        </div>
      </div>
    );
  }

  if (error || !cvData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy CV'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { cv, template, sections } = cvData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden when printing */}
      <div className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{cv.title}</h1>
                {template && (
                  <p className="text-sm text-gray-500">Template: {template.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LuPrinter className="w-4 h-4" />
                In CV
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LuDownload className="w-4 h-4" />
                Tải xuống PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Preview */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-0">
        <div className="bg-white shadow-2xl print:shadow-none relative" style={{ minHeight: '297mm' }}>
          {/* Template Background */}
          {template?.thumbnail_url && (
            <div
              className="absolute inset-0 opacity-15 print:opacity-10"
              style={{
                backgroundImage: `url(${template.thumbnail_url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'top center',
                backgroundRepeat: 'no-repeat',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Content */}
          <div className="relative z-10">
            {sections?.map((section: any, index: number) => {
              if (!section.is_visible) return null;
              
              const hasData = section.data && Object.keys(section.data).length > 0;
              if (!hasData) return null;
              
              const pos = section.position || { x: 0, y: 0, width: 100, height: 20 };
              
              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.width}%`,
                    minHeight: `${pos.height}%`,
                    padding: '10px'
                  }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-500">
                    <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                      {section.name}
                    </h3>
                  </div>

                  {/* Section Content */}
                  <div className="space-y-2">
                    {section.default_fields?.fields?.map((field: any) => {
                      const value = section.data[field.id];
                      if (!value || value === '<p><br></p>') return null;
                      
                      return (
                        <div key={field.id} className="text-gray-900">
                          {field.type === 'image' ? (
                            <img 
                              src={value} 
                              alt={field.label}
                              className="w-32 h-32 object-cover rounded-lg shadow-md border-2 border-gray-200"
                            />
                          ) : (
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-gray-600 uppercase">
                                {field.label}
                              </div>
                              <div 
                                className="text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: value }}
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:opacity-10 { opacity: 0.1 !important; }
        }
      `}</style>
    </div>
  );
};

export default CVPreview;
