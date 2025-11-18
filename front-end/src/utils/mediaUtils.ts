/**
 * Utility functions for handling media URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
// Extract the base URL without /api
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * Convert a relative media URL to a full URL
 * @param url - The URL from the media object (can be relative or absolute)
 * @returns Full URL that can be used in img src
 */
export const getMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If URL is already absolute (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL is relative, prepend the backend base URL
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  
  // If URL doesn't start with /, add it
  return `${BACKEND_BASE_URL}/${url}`;
};

/**
 * Get the full URL for a logo from a logo object
 * @param logo - The logo object with url property
 * @returns Full URL or null
 */
export const getLogoUrl = (logo: { url?: string } | null | undefined): string | null => {
  if (!logo || !logo.url) return null;
  return getMediaUrl(logo.url);
};
