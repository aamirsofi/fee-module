import { useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { schoolService, School } from "../../../services/schoolService";
import { Route } from "../../../types";

export type { Route };

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseRoutesDataParams {
  page: number;
  limit: number;
  search: string;
  selectedSchoolId: string | number;
}

interface UseRoutesDataReturn {
  // Routes
  routes: Route[];
  paginationMeta: PaginationMeta | null;
  loadingRoutes: boolean;
  refetchRoutes: () => void;

  // Schools
  schools: School[];
  loadingSchools: boolean;
}

export function useRoutesData({
  page,
  limit,
  search,
  selectedSchoolId,
}: UseRoutesDataParams): UseRoutesDataReturn {
  // TanStack Query for routes
  const {
    data: routesData,
    isLoading: loadingRoutes,
    refetch: refetchRoutes,
  } = useQuery({
    queryKey: ["routes", page, limit, search, selectedSchoolId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      // Only add schoolId if it's a valid number (not empty string)
      if (selectedSchoolId && selectedSchoolId !== "" && selectedSchoolId !== "__EMPTY__") {
        params.schoolId = selectedSchoolId;
      }

      const response = await api.instance.get("/super-admin/routes", {
        params,
      });

      if (response.data.data && response.data.meta) {
        return {
          data: response.data.data,
          meta: response.data.meta,
        };
      } else if (Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: {
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      return { data: [], meta: null };
    },
  });

  const routes: Route[] = useMemo(
    () => routesData?.data || [],
    [routesData]
  );

  const paginationMeta: PaginationMeta | null = useMemo(
    () => routesData?.meta || null,
    [routesData]
  );

  // TanStack Query for schools (using infinite query for pagination)
  const {
    data: schoolsData,
    isLoading: loadingSchools,
  } = useInfiniteQuery({
    queryKey: ["schools", "active"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolService.getSchools({
        page: pageParam,
        limit: 100,
        status: "active",
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
  });

  const schools: School[] = useMemo(() => {
    if (!schoolsData?.pages) return [];
    return schoolsData.pages.flatMap((page) => page.data || []);
  }, [schoolsData]);

  return {
    routes,
    paginationMeta,
    loadingRoutes,
    refetchRoutes,
    schools,
    loadingSchools,
  };
}

