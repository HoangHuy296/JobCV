import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { getUserFromToken, isTokenExpired } from '../utils/tokenUtils';
import { getMyCompany } from '../api/companyService';
import type { Company } from '../api/companyService';
import { notificationWebSocket } from '../services/notificationWebSocket';

// Define the user type
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  image: string | null;
  is_active: boolean;
  email_notifications_enabled?: boolean;
}

// Define the context type
interface UserContextType {
  user: User | null;
  company: Company | null;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  companyLoading: boolean;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  // Lazy initialization of user state to avoid expensive computation on every render
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      return getUserFromToken(token);
    }
    return null;
  });

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  // Memoize isAuthenticated to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    company,
    setUser,
    setCompany,
    isAuthenticated,
    loading,
    companyLoading
  }), [user, company, isAuthenticated, loading, companyLoading]);

  // Optimized login function with useCallback
  const login = useCallback(async (token: string) => {
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Decode token and set user
    const userData = getUserFromToken(token);
    if (userData) {
      setUser(userData);
      
      // Connect to WebSocket for real-time notifications
      notificationWebSocket.connect(token);
      
      // If user is a recruiter, fetch their company
      if (userData.role === 'recruiter') {
        try {
          setCompanyLoading(true);
          const companyData = await getMyCompany();
          setCompany(companyData);
        } catch (error) {
          // If company not found, that's okay - company will remain null
          setCompany(null);
        } finally {
          setCompanyLoading(false);
        }
      }
    }
  }, []);

  // Optimized logout function with useCallback
  const logout = useCallback(() => {
    // Disconnect WebSocket
    notificationWebSocket.disconnect();
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Clear user state
    setUser(null);
    setCompany(null);
  }, []);

  // Check for existing token on app load - optimized version
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      const token = localStorage.getItem('token');
      
      if (token) {
        if (isTokenExpired(token)) {
          // Token is expired, remove it and clear user
          localStorage.removeItem('token');
          if (isMounted) {
            setUser(null);
            setCompany(null);
          }
        } else {
          // Token is valid, set user data
          const userData = getUserFromToken(token);
          if (userData && userData.is_active) {
            if (isMounted) {
              setUser(userData);
              // Connect to WebSocket for real-time notifications
              notificationWebSocket.connect(token);
              // If user is a recruiter, fetch their company
              if (userData.role === 'recruiter') {
                try {
                  setCompanyLoading(true);
                  const companyData = await getMyCompany();
                  if (isMounted) setCompany(companyData);
                } catch (error) {
                  // If company not found, that's okay - company will remain null
                  if (isMounted) setCompany(null);
                } finally {
                  if (isMounted) setCompanyLoading(false);
                }
              }
            }
          } else {
            // If token is invalid or user is inactive, remove it
            localStorage.removeItem('token');
            if (isMounted) {
              setUser(null);
              setCompany(null);
            }
          }
        }
      }
      if (isMounted) setLoading(false);
    };
    
    // Set loading to true when starting check
    setLoading(true);
    // Check auth
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading indicator while checking auth
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <UserContext.Provider value={{ ...contextValue, login, logout }}>
      {children}
    </UserContext.Provider>
  );
});

// Custom hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
