import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { schoolService, School } from '../services/schoolService';
import { useInfiniteQuery } from '@tanstack/react-query';

interface SchoolContextType {
  selectedSchoolId: string | number | null;
  setSelectedSchoolId: (schoolId: string | number | null) => void;
  selectedSchool: School | null;
  schools: School[];
  loadingSchools: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | number | null>(null);

  // Load schools for super admin
  const { data: schoolsData, isLoading: loadingSchools } = useInfiniteQuery({
    queryKey: ['schools', 'active'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolService.getSchools({
        page: pageParam,
        limit: 100,
        status: 'active',
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.hasNextPage) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: user?.role === 'super_admin',
  });

  const schools: School[] = schoolsData?.pages.flatMap((page) => page.data || []) || [];

  // Initialize selected school based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        // For super admin, try to load from localStorage or select first school
        const savedSchoolId = localStorage.getItem('selected_school_id');
        if (savedSchoolId && schools.some(s => s.id.toString() === savedSchoolId)) {
          setSelectedSchoolIdState(savedSchoolId);
        } else if (schools.length > 0 && !selectedSchoolId) {
          // Auto-select first school if nothing is saved
          const firstSchoolId = schools[0].id.toString();
          setSelectedSchoolIdState(firstSchoolId);
          localStorage.setItem('selected_school_id', firstSchoolId);
        }
      } else {
        // For regular users, use their assigned school
        setSelectedSchoolIdState(user.schoolId || null);
      }
    }
  }, [user, schools]);

  // Save to localStorage when selected school changes (for super admin)
  useEffect(() => {
    if (user?.role === 'super_admin' && selectedSchoolId) {
      localStorage.setItem('selected_school_id', selectedSchoolId.toString());
    }
  }, [selectedSchoolId, user]);

  const setSelectedSchoolId = (schoolId: string | number | null) => {
    setSelectedSchoolIdState(schoolId);
  };

  const selectedSchool = schools.find(
    (s) => s.id.toString() === selectedSchoolId?.toString()
  ) || null;

  return (
    <SchoolContext.Provider
      value={{
        selectedSchoolId,
        setSelectedSchoolId,
        selectedSchool,
        schools,
        loadingSchools,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}

