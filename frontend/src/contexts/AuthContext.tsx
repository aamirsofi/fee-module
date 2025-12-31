import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { schoolsService } from '../services/schools.service';
import { User, LoginCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // If user has a schoolId but no subdomain is set, fetch it
          // Only super admin can access /api/schools/:id, so skip for regular users
          if (userData.schoolId && !localStorage.getItem('school_subdomain') && userData.role === 'super_admin') {
            try {
              const school = await schoolsService.getById(userData.schoolId);
              if (school && school.subdomain) {
                localStorage.setItem('school_subdomain', school.subdomain);
              }
            } catch (error) {
              // Silently fail - school might not exist or user doesn't have access
            }
          }
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('school_subdomain');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    
    // If user has a schoolId, fetch the school and set subdomain in localStorage
    // Only super admin can access /api/schools/:id endpoint
    if (response.user.schoolId && response.user.role === 'super_admin') {
      try {
        const school = await schoolsService.getById(response.user.schoolId);
        if (school && school.subdomain) {
          localStorage.setItem('school_subdomain', school.subdomain);
        }
      } catch (error) {
        // Don't fail login if school fetch fails
      }
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('school_subdomain');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

