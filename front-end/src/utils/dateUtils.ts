/**
 * Date utility functions for parsing MySQL datetime strings
 * Backend sends local time (Vietnam UTC+7) in format: 'YYYY-MM-DD HH:mm:ss'
 */

/**
 * Parse MySQL datetime string to JavaScript Date object
 * Converts 'YYYY-MM-DD HH:mm:ss' to local time
 */
export const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // Replace space with 'T' to parse as local time (not UTC)
  const localDateString = dateString.replace(' ', 'T');
  return new Date(localDateString);
};

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return '';
  
  const date = parseDate(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return date.toLocaleDateString('vi-VN', options || defaultOptions);
};

/**
 * Format date to long Vietnamese format (e.g., "4 tháng 12, 2025")
 */
export const formatDateLong = (dateString: string): string => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = parseDate(dateString);
  const now = new Date();
  
  // Set both to midnight for day comparison
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return date < now;
};

/**
 * Get relative time string (e.g., "2 giờ trước", "3 ngày trước")
 */
export const getRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = parseDate(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  
  return formatDate(dateString);
};

/**
 * Get days difference between two dates
 */
export const getDaysDifference = (dateString1: string, dateString2: string): number => {
  const date1 = parseDate(dateString1);
  const date2 = parseDate(dateString2);
  
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
