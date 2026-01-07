// Admin module exports
export { default as Dashboard } from './Dashboard';
export { default as AdminJobManagement } from './business/JobManagement';
export { default as JobReviewManagement } from './business/JobReviewManagement';
export { default as UnifiedJobManagement } from './business/UnifiedJobManagement';
export { default as AdminCompanyManagement } from './business/CompanyManagement';
export { default as AdminCVTemplateManagement } from './business/AdminCVTemplateManagement';
export { default as AdminCVManagement } from './business/AdminCVManagement';
export { default as IndustryManagement } from './business/IndustryManagement';
export { default as RoleManagement } from './system/RoleManagement';
export { default as UserManagement } from './system/UserManagement';
export { default as SettingsManagement } from './system/SettingsManagement';
export { default as MediaManagement } from './system/MediaManagement';
export { default as NotificationManagement } from './system/NotificationManagement';
export { default as AISettings } from './system/AISettings';

// Export all admin components as a single module
export * from './Dashboard';
export * from './business/JobManagement';
export * from './business/CompanyManagement';
export * from './business/IndustryManagement';
export * from './system/RoleManagement';
export * from './system/UserManagement';
export * from './system/SettingsManagement';
