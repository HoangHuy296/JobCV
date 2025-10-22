import api from './index';

// Get all locations (wards)
export const getAllLocations = async (): Promise<string[]> => {
  const response = await api.get('/jobs/locations');
  return response.data.result;
};
