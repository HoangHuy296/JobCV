import apiClient from './index';

// Subscribe to a company
export const subscribeToCompany = async (companyId: number): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/companies/${companyId}/subscribe`);
    return response.data.result;
  } catch (error) {
    console.error('Error subscribing to company:', error);
    throw error;
  }
};

// Unsubscribe from a company
export const unsubscribeFromCompany = async (companyId: number): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/companies/${companyId}/unsubscribe`);
    return response.data.result;
  } catch (error) {
    console.error('Error unsubscribing from company:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async (companyId: number): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/companies/${companyId}/subscription-status`);
    return response.data.result.isSubscribed;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
};
