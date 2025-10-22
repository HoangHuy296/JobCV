import React from 'react';
import { useTableAction } from '../../contexts/TableActionContext';
import type { TableAction } from '../../contexts/TableActionContext';

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
  type?: 'add' | 'delete' | 'default';
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  additionalActions?: (record: T) => Action<T>[];
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  loading?: boolean;
}

const GenericTable = <T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  additionalActions,
  showEditAction = true,
  showDeleteAction = true,
  loading = false
}: GenericTableProps<T>) => {
  const { setActions, setPosition, setIsOpen } = useTableAction();

  const handleActionsClick = (event: React.MouseEvent, record: T) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Prepare actions for the dropdown
    const actionsList: TableAction[] = [];
    
    // Add edit action if available
    if (showEditAction && onEdit) {
      actionsList.push({
        id: 'edit',
        label: 'Sửa',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
        onClick: () => onEdit(record),
        className: 'cursor-pointer text-blue-600 hover:text-blue-900',
        type: 'default'
      });
    }
    
    // Add additional actions if available
    if (additionalActions) {
      const additionalActionsList = additionalActions(record).map((action, index) => ({
        id: `additional-${index}`,
        label: action.label,
        icon: action.icon,
        onClick: () => action.onClick(record),
        className: action.className,
        type: action.type || 'default'
      }));
      actionsList.push(...additionalActionsList);
    }
    
    // Add delete action if available (always at the end)
    if (showDeleteAction && onDelete) {
      actionsList.push({
        id: 'delete',
        label: 'Xóa',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
        onClick: () => onDelete(record),
        className: 'cursor-pointer text-red-600 hover:text-red-900',
        type: 'delete'
      });
    }
    
    // Set the actions and position for the dropdown
    setActions(actionsList);
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
            {((showEditAction && onEdit) || (showDeleteAction && onDelete) || additionalActions) && (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                Hành động
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record, index) => (
            <tr key={record.id || index}>
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {column.render
                    ? column.render(record[column.key], record)
                    : String(record[column.key])}
                </td>
              ))}
              {((showEditAction && onEdit) || (showDeleteAction && onDelete) || additionalActions) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                  <button
                    onClick={(e) => handleActionsClick(e, record)}
                    className="cursor-pointer p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Actions"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default GenericTable;
