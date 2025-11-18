import apiClient from './index';

export interface DashboardStats {
  overview: {
    users: {
      total_users: number;
      active_users: number;
      inactive_users: number;
      new_users_today: number;
    };
    jobs: {
      total_jobs: number;
      active_jobs: number;
      inactive_jobs: number;
      new_jobs_today: number;
    };
    companies: {
      total_companies: number;
      active_companies: number;
      new_companies_today: number;
    };
    cvs: {
      total_cvs: number;
      new_cvs_today: number;
    };
    campaigns: {
      total_campaigns: number;
      active_campaigns: number;
    };
    notifications: {
      total_notifications: number;
      unread_notifications: number;
      notifications_today: number;
    };
  };
  charts: {
    userGrowth: Array<{ date: string; count: number }>;
    jobGrowth: Array<{ date: string; count: number }>;
    roleDistribution: Array<{ role: string; count: number }>;
    topIndustries: Array<{ industry: string; job_count: number }>;
  };
  recentActivities: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard/admin/stats');
  return response.data.result;
};
