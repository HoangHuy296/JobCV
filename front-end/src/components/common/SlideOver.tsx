import React, { useRef, useEffect, useState } from 'react';
import SelectWithSearch from './SelectWithSearch';
import LocationSelect from './LocationSelect';
import IndustrySelect from './IndustrySelect';
import QuillEditor from './QuillEditor';

interface SlideOverProps {
  title: string;
  children?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: Record<string, any>) => void;
  showActionButtons?: boolean;
  fields?: FormField[];
  initialValues?: Record<string, any>;
  submitButtonText?: string;
  cancelButtonText?: string;
  isSubmitting?: boolean;
  keepFormDataOnSubmit?: boolean;
}

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'multiselect' | 'custom' | 'location' | 'industry' | 'image' | 'editor' | 'datetime';
  required?: boolean;
  options?: { value: any; label: string }[];
  placeholder?: string;
  defaultValue?: any;
  multiple?: boolean;
  render?: (value: any, onChange: (value: any) => void) => React.ReactNode;
};

const SlideOver: React.FC<SlideOverProps> = ({ 
  title, 
  children, 
  isOpen, 
  onClose, 
  onSubmit,
  fields = [],
  initialValues = {},
  isSubmitting = false,
  keepFormDataOnSubmit = true,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  
  // Track the previous initialValues to detect changes
  const prevInitialValuesRef = useRef<string>('');
  
  // Initialize or update formData when initialValues or fields change
  useEffect(() => {
    // Convert initialValues to a string for comparison
    const initialValuesKey = JSON.stringify(initialValues);
    
    // Check if initialValues have changed
    if (prevInitialValuesRef.current !== initialValuesKey) {
      prevInitialValuesRef.current = initialValuesKey;
      
      // Initialize form data with new values
      const data: Record<string, any> = {};
      fields.forEach(field => {
        if (field.type === 'multiselect' || field.multiple) {
          // For multi-select, ensure we have an array
          data[field.name] = Array.isArray(initialValues[field.name]) 
            ? initialValues[field.name] 
            : (field.defaultValue ?? []);
        } else if (field.type === 'checkbox') {
          // For checkboxes, ensure we have a boolean value
          // Handle both boolean values and numeric values (0/1)
          const value = initialValues[field.name];
          if (value === true || value === 1 || value === '1') {
            data[field.name] = true;
          } else if (value === false || value === 0 || value === '0') {
            data[field.name] = false;
          } else {
            data[field.name] = field.defaultValue ?? false;
          }
        } else {
          data[field.name] = initialValues[field.name] ?? field.defaultValue ?? '';
        }
      });
      setFormData(data);
    }
  }, [initialValues, fields]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (name: string, selectedValues: string[]) => {
    setFormData(prev => ({ ...prev, [name]: selectedValues }));
    
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required) {
        if (field.type === 'multiselect' || field.multiple) {
          // For multi-select, check if array is empty
          if (!formData[field.name] || !Array.isArray(formData[field.name]) || formData[field.name].length === 0) {
            newErrors[field.name] = `${field.label} là bắt buộc`;
          }
        } else if (field.type === 'image') {
          // For image fields, check if either URL or file is provided
          const hasUrl = formData[field.name] && typeof formData[field.name] === 'string' && formData[field.name].trim() !== '';
          const hasFile = formData[field.name] instanceof File;
          
          if (field.required && !hasUrl && !hasFile) {
            newErrors[field.name] = `${field.label} là bắt buộc (URL hoặc file)`;
          }
        } else {
          // For other fields, check if value is empty
          if (!formData[field.name] || formData[field.name].toString().trim() === '') {
            newErrors[field.name] = `${field.label} là bắt buộc`;
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      // Create a copy of the form data to avoid reference issues
      const formDataToSubmit = { ...formData };
      
      // Pass the current form data to the onSubmit handler
      onSubmit(formDataToSubmit);
      
      // If not keeping form data on submit, reset form fields
      if (!keepFormDataOnSubmit) {
        // Reset form to initial values
        const data: Record<string, any> = {};
        fields.forEach(field => {
          if (field.type === 'multiselect' || field.multiple) {
            data[field.name] = Array.isArray(initialValues[field.name]) 
              ? initialValues[field.name] 
              : (field.defaultValue ?? []);
          } else if (field.type === 'checkbox') {
            data[field.name] = initialValues[field.name] === true || initialValues[field.name] === false 
              ? initialValues[field.name] 
              : (field.defaultValue ?? false);
          } else {
            data[field.name] = initialValues[field.name] ?? field.defaultValue ?? '';
          }
        });
        setFormData(data);
      }
      // When keepFormDataOnSubmit is true, we keep the current formData
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-70 transition-opacity"></div>

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md transform transition ease-in-out duration-300 translate-x-0">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="px-4 py-6 bg-gray-50 sm:px-6">
                <div className="flex items-start justify-between space-x-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                  </div>
                  <div className="flex h-7 items-center">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
                    >
                      <span className="sr-only">Close panel</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-gray-200"></div>

              {/* Content */}
              <div className="flex-1 px-4 py-6 sm:px-6">
                {fields?.length > 0 ? (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {fields.map(field => (
                        <div key={field.name}>
                          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {field.type === 'textarea' ? (
                            <textarea
                              id={field.name}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              rows={3}
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                            />
                          ) : field.type === 'select' ? (
                            <SelectWithSearch
                              options={field.options || []}
                              selectedValues={formData[field.name] || []}
                              onChange={(selectedValues) => handleMultiSelectChange(field.name, selectedValues)}
                              placeholder={field.placeholder}
                              className="w-full"
                              multiple={field.multiple}
                              error={errors[field.name]}
                            />
                          ) : field.type === 'checkbox' ? (
                            <button
                              type="button"
                              id={field.name}
                              onClick={() => {
                                const newValue = !formData[field.name];
                                setFormData(prev => ({ ...prev, [field.name]: newValue }));
                              }}
                              className={`${formData[field.name] ? 'bg-blue-600' : 'bg-gray-200'}
                                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              role="switch"
                              aria-checked={formData[field.name]}
                            >
                              <span className="sr-only">{field.label}</span>
                              <span
                                aria-hidden="true"
                                className={`${formData[field.name] ? 'translate-x-5' : 'translate-x-0'}
                                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          ) : field.type === 'location' ? (
                            <LocationSelect
                              selectedValues={formData[field.name] || []}
                              onChange={(value) => {
                                setFormData(prev => ({ ...prev, [field.name]: value }));
                                
                                // Clear error when user makes a selection
                                if (errors[field.name]) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[field.name];
                                    return newErrors;
                                  });
                                }
                              }}
                              error={errors[field.name]}
                            />
                          ) : field.type === 'industry' ? (
                            <IndustrySelect
                              selectedValues={formData[field.name] || []}
                              onChange={(value) => {
                                setFormData(prev => ({ ...prev, [field.name]: value }));
                                
                                // Clear error when user makes a selection
                                if (errors[field.name]) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[field.name];
                                    return newErrors;
                                  });
                                }
                              }}
                              multiple={field.multiple}
                              placeholder={field.placeholder}
                              error={errors[field.name]}
                            />
                          ) : field.type === 'image' ? (
                            <div>
                              <div>
                                <input
                                  type="text"
                                  id={`${field.name}_url`}
                                  name={`${field.name}_url`}
                                  value={formData[field.name] && typeof formData[field.name] === 'string' && !formData[field.name].startsWith('blob:') ? formData[field.name] : ''}
                                  onChange={(e) => {
                                    const url = e.target.value || '';
                                    setFormData(prev => ({ ...prev, [field.name]: url }));
                                    
                                    // Clear error when user types
                                    if (errors[field.name]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[field.name];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  placeholder="Nhập URL"
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                                />
                              </div>
                              
                              <div className="mt-2 mb-2">
                                <span className="text-gray-500">Hoặc</span>
                              </div>
                              
                              <div>
                                <input
                                  type="file"
                                  id={field.name}
                                  name={field.name}
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setFormData(prev => ({ ...prev, [field.name]: file }));
                                      
                                      // Create preview
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        if (e.target?.result) {
                                          setImagePreviews(prev => ({
                                            ...prev,
                                            [field.name]: e.target?.result as string
                                          }));
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } else {
                                      setFormData(prev => ({ ...prev, [field.name]: null }));
                                      setImagePreviews(prev => {
                                        const newPreviews = { ...prev };
                                        delete newPreviews[field.name];
                                        return newPreviews;
                                      });
                                    }
                                    
                                    // Clear error when user selects a file
                                    if (errors[field.name]) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[field.name];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                              </div>
                              
                              {/* Preview for both URL and file inputs */}
                              {(formData[field.name] && typeof formData[field.name] === 'string' && !formData[field.name].startsWith('blob:')) || imagePreviews[field.name] ? (
                                <div className="mt-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                                  <img 
                                    src={(formData[field.name] && typeof formData[field.name] === 'string' && !formData[field.name].startsWith('blob:')) ? formData[field.name] : imagePreviews[field.name]} 
                                    alt="Preview" 
                                    className="h-32 w-32 object-cover rounded-md border border-gray-300"
                                    onError={(e) => {
                                      // Hide broken image if URL is invalid
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                    onLoad={(e) => {
                                      // Show image when it loads successfully
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'block';
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : field.type === 'editor' ? (
                            <QuillEditor
                              value={formData[field.name] || ''}
                              onChange={(value: string) => {
                                setFormData(prev => ({ ...prev, [field.name]: value }));
                                
                                // Clear error when user types
                                if (errors[field.name]) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[field.name];
                                    return newErrors;
                                  });
                                }
                              }}
                              placeholder={field.placeholder}
                              error={errors[field.name]}
                            />
                          ) : field.type === 'datetime' ? (
                            <input
                              type="date"
                              id={field.name}
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                            />
                          ) : field.type === 'custom' && field.render ? (
                            field.render(formData[field.name], (value) => {
                              setFormData(prev => ({ ...prev, [field.name]: value }));
                              
                              // Clear error when user makes a selection
                              if (errors[field.name]) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[field.name];
                                  return newErrors;
                                });
                              }
                            })
                          ) : (
                            <input
                              type={field.type}
                              id={field.name}
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                            />
                          )}
                          
                          {errors[field.name] && (
                            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </form>
                ) : (
                  children
                )}
              </div>
            </div>

            {/* Action buttons */}
            {(fields?.length > 0) && onSubmit && (
              <div className="flex-shrink-0 px-4 py-4 sm:px-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as any)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
