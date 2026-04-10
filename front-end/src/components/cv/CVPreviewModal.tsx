import React, { useEffect, useState, useCallback } from 'react';
import { LuLoader, LuX, LuDownload, LuPrinter } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { getCVPreviewData } from '../../api/cvTemplateService';
import { downloadCV } from '../../api/cvService';

interface CVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: number;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ isOpen, onClose, cvId }) => {
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCVPreview = useCallback(async () => {
    if (!cvId) return;
    
    try {
      setLoading(true);
      const response = await getCVPreviewData(cvId);
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
    if (isOpen && cvId) {
      loadCVPreview();
    }
  }, [isOpen, cvId, loadCVPreview]);

  const handleDownload = useCallback(async () => {
    if (!cvId) return;
    
    try {
      const blob = await downloadCV(cvId);
      
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { cv, template, sections } = cvData;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${cv.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
          }
          .container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          .template-bg {
            position: absolute;
            inset: 0;
            background-image: url('${template?.thumbnail_url || ''}');
            background-size: contain;
            background-position: top center;
            background-repeat: no-repeat;
            opacity: 0.1;
            pointer-events: none;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .section {
            padding: 10px;
            margin-bottom: 15px;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .field {
            margin-bottom: 8px;
          }
          .field-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .field-value {
            font-size: 12px;
            line-height: 1.6;
            color: #1f2937;
            word-break: break-word;
          }
          .field-image {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="template-bg"></div>
          <div class="content">
    `;
    
    sections?.forEach((section: any) => {
      if (!section.is_visible) return;
      
      const hasData = section.data && Object.keys(section.data).length > 0;
      if (!hasData) return;
      
      const layout = section.layout || { row: 0, column_width: 1, min_height: 150 };
      
      html += `
        <div class="section" style="min-height: ${layout.min_height}px;">
          <div class="section-header">
            <div class="section-title">${section.name}</div>
          </div>
      `;
      
      section.default_fields?.fields?.forEach((field: any) => {
        const value = section.data[field.id];
        if (!value || value === '<p><br></p>') return;
        
        if (field.type === 'image') {
          html += `
            <div class="field">
              <img src="${value}" alt="${field.label}" class="field-image" />
            </div>
          `;
        } else {
          html += `
            <div class="field">
              <div class="field-label">${field.label}</div>
              <div class="field-value">${value}</div>
            </div>
          `;
        }
      });
      
      html += `</div>`;
    });
    
    html += `
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [cvData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-70 transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {cvData?.cv?.title || 'Xem trước CV'}
              </h2>
              {cvData?.template && (
                <p className="text-sm text-gray-500">Template: {cvData.template.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={loading || !!error}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LuPrinter className="w-4 h-4" />
                In CV
              </button>
              <button
                onClick={handleDownload}
                disabled={loading || !!error}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LuDownload className="w-4 h-4" />
                Tải xuống PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <LuX className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LuLoader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Đang tải CV...</p>
                </div>
              </div>
            ) : error || !cvData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error || 'Không tìm thấy CV'}</p>
                </div>
              </div>
            ) : (
              <div className="max-w-[210mm] mx-auto">
                <div className="bg-white shadow-2xl relative" style={{ minHeight: '297mm' }}>
                  {/* Template Background */}
                  {cvData.template?.thumbnail_url && (
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `url(${cvData.template.thumbnail_url})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'top center',
                        backgroundRepeat: 'no-repeat',
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    {cvData.sections?.map((section: any, index: number) => {
                      if (!section.is_visible) return null;
                      
                      const hasData = section.data && Object.keys(section.data).length > 0;
                      if (!hasData) return null;
                      
                      const layout = section.layout || { row: 0, column_width: 1, min_height: 150 };
                      
                      return (
                        <div
                          key={index}
                          className="mb-4"
                          style={{
                            minHeight: `${layout.min_height}px`,
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreviewModal;
