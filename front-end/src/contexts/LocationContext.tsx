import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllLocations } from '../api/locationService';

interface LocationContextType {
  locations: string[];
  loading: boolean;
  error: string | null;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const locationStrings = await getAllLocations();
      setLocations(locationStrings);
    } catch (err) {
      setError('Failed to fetch locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent double API calls in development mode due to React StrictMode
    let shouldFetch = true;
    
    if (shouldFetch) {
      fetchLocations();
    }
    
    return () => {
      shouldFetch = false;
    };
  }, [fetchLocations]);

  const value = {
    locations,
    loading,
    error,
    refreshLocations: fetchLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
