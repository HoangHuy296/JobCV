import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllIndustries, type Industry } from '../api/industryService';
import { useUser } from './UserContext';

interface IndustryContextType {
  industries: Industry[];
  loading: boolean;
  error: string | null;
  refreshIndustries: () => Promise<void>;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

export const useIndustryContext = () => {
  const context = useContext(IndustryContext);
  if (context === undefined) {
    throw new Error('useIndustryContext must be used within an IndustryProvider');
  }
  return context;
};

interface IndustryProviderProps {
  children: React.ReactNode;
}

export const IndustryProvider: React.FC<IndustryProviderProps> = ({ children }) => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useUser();

  const fetchIndustries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const industriesResponse = await getAllIndustries(1, 1000, '', true); // Fetch all industries
      setIndustries(industriesResponse.industries);
    } catch (err) {
      setError('Failed to fetch industries');
      console.error('Error fetching industries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent double API calls in development mode due to React StrictMode
    let shouldFetch = true;
    
    if (shouldFetch) {
      fetchIndustries();
    }
    
    return () => {
      shouldFetch = false;
    };
  }, [fetchIndustries, isAuthenticated]);

  const value = {
    industries,
    loading,
    error,
    refreshIndustries: fetchIndustries
  };

  return (
    <IndustryContext.Provider value={value}>
      {children}
    </IndustryContext.Provider>
  );
};

export default IndustryContext;
