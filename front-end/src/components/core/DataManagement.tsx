import React, { useState } from 'react';
import GenericTable from './GenericTable';
import SlideOver from '../common/SlideOver';
import ConfirmModal from '../common/ConfirmModal';
import type { FormField } from '../common/SlideOver';

type Column<T> = {
  key: keyof T;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
};

interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  className?: string;
}

interface DataManagementProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  formFields: FormField[];
  loading?: boolean;
  onEdit?: (record: T) => Promise<void> | void;
  onDelete?: (record: T) => Promise<void> | void;
  onCreate?: (values: Record<string, any>) => Promise<T | null> | void;
  onRefresh: () => void;
  action?: {
    showAddAction?: boolean,
    showEditAction?: boolean,
    showDeleteAction?: boolean,
    additionalActions?: (record: T) => Action<T>[];
  }
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
  filters?: {
    onFilter?: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    additionalFilters?: React.ReactNode;
  };
}

const DataManagement = <T extends { id: number }>({
  title,
  data,
  columns,
  formFields,
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  onRefresh,
  action = {
    showAddAction: true,
    showEditAction: true,
    showDeleteAction: true,
    additionalActions: () => []
  },
  pagination,
  filters
}: DataManagementProps<T>) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<T | null>(null);

  const handleEdit = (record: T) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      if (editingRecord && onEdit) {
        // For edit operations, merge the values with the existing record
        const updatedRecord = { ...editingRecord, ...values };
        await onEdit(updatedRecord);
        
        // Update the editing record with the new values to keep them in the form
        setEditingRecord(updatedRecord as T);
        
        // Refresh the data to show updated values in the table
        onRefresh();
      } else if (onCreate) {
        try {
          // For create operations
          const createdRecord = await onCreate(values);
          
          // If we have a response with an ID, switch to edit mode for the newly created record
          if (createdRecord && 'id' in createdRecord) {
            // Set the newly created record as the editing record
            setEditingRecord(createdRecord as T);
            // Refresh the data to include the new record
          }

          // Refresh the data to include the new record
          onRefresh();
        } catch (error) {
          console.error('Error creating record:', error);
        }
      }
      
      // Note: We don't close the modal here to keep the form open
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (record: T) => {
    setRecordToDelete(record);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || !onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(recordToDelete);
      setShowConfirmDelete(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setRecordToDelete(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {(action?.showAddAction ?? true) && onCreate && (
            <button
              onClick={handleCreate}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Thêm mới
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-6 flex flex-col flex-wrap md:flex-row md:items-end gap-4">
          {filters && (
            <div className="flex-1 flex flex-col flex-wrap md:flex-row md:items-end gap-4">
              <div className="w-full md:w-64">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.searchTerm}
                  onChange={(e) => filters.onSearchChange(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {filters.additionalFilters}
              <div className="flex items-end">
                <button
                  onClick={filters.onFilter || onRefresh}
                  disabled={loading || isSubmitting}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-10 ${loading || isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                >
                  {loading || isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 inline-block h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Lọc
                    </>
                  ) : (
                    'Lọc'
                  )}
                </button>
              </div>
            </div>
          )}
          {onRefresh && (
            <div className="flex justify-end md:justify-end">
              <button
                onClick={onRefresh}
                disabled={loading || isSubmitting}
                className={`p-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading || isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                title="Làm mới"
              >
                {loading || isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <GenericTable
          data={data}
          columns={columns}
          onEdit={onEdit ? handleEdit : undefined}
          onDelete={onDelete ? handleDeleteClick : undefined}
          additionalActions={action?.additionalActions ?? (() => [])}
          showEditAction={action?.showEditAction ?? true}
          showDeleteAction={action?.showDeleteAction ?? true}
          loading={loading}
        />

        {/* Pagination */}
        {pagination && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> đến{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </span>{' '}
              trong tổng số <span className="font-medium">{pagination.totalItems}</span> {title.toLowerCase()}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-md ${pagination.currentPage === 1 || loading || isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer'}`}
              >
                {loading || isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 inline-block h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Trước
                  </>
                ) : (
                  'Trước'
                )}
              </button>
              
              {/* Page numbers with ellipsis for many pages */}
              {(() => {
                // Always show first page
                const visiblePages = [1];
                
                // Calculate the range around current page
                const rangeStart = Math.max(2, pagination.currentPage - 1);
                const rangeEnd = Math.min(pagination.totalPages - 1, pagination.currentPage + 1);
                
                // Add ellipsis after first page if needed
                if (rangeStart > 2) {
                  visiblePages.push(-1); // -1 represents ellipsis
                }
                
                // Add pages around current page
                for (let i = rangeStart; i <= rangeEnd; i++) {
                  visiblePages.push(i);
                }
                
                // Add ellipsis before last page if needed
                if (rangeEnd < pagination.totalPages - 1) {
                  visiblePages.push(-2); // -2 represents ellipsis (different key from the first one)
                }
                
                // Always show last page if there is more than one page
                if (pagination.totalPages > 1) {
                  visiblePages.push(pagination.totalPages);
                }
                
                // Return the page buttons
                return visiblePages.map(pageNum => {
                  // Render ellipsis
                  if (pageNum === -1 || pageNum === -2) {
                    return (
                      <span 
                        key={`ellipsis-${pageNum}`} 
                        className="px-4 py-2 text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  
                  // Render page button
                  return (
                    <button
                      key={pageNum}
                      onClick={() => pagination.onPageChange(pageNum)}
                      disabled={loading || isSubmitting}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${pagination.currentPage === pageNum ? 'bg-blue-600 text-white' : loading || isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
              
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || loading || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-md ${pagination.currentPage === pagination.totalPages || loading || isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer'}`}
              >
                {loading || isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 inline-block h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sau
                  </>
                ) : (
                  'Sau'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SlideOver for Create/Edit */}
      <SlideOver
        title={editingRecord ? `Cập nhật ${title.toLowerCase()}` : `Thêm ${title.toLowerCase()} mới`}
        isOpen={showModal}
        onClose={handleCloseModal}
        fields={formFields}
        initialValues={editingRecord || {}}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        keepFormDataOnSubmit={true}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${title.toLowerCase()} này? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default DataManagement;
