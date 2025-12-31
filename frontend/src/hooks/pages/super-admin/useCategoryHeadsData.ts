import { useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { schoolService, School } from "../../../services/schoolService";

export interface CategoryHead {
  id: number;
  name: string;
  description?: string;
  status: string;
  schoolId: number;
  school?: {
    id: number;
    name: string;
    subdomain: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseCategoryHeadsDataParams {
  page: number;
  limit: number;
  search: string;
  selectedSchoolId: string | number;
}

interface UseCategoryHeadsDataReturn {
  // Category Heads
  categoryHeads: CategoryHead[];
  paginationMeta: PaginationMeta | null;
  loadingCategoryHeads: boolean;
  refetchCategoryHeads: () => void;

  // Schools
  schools: School[];
  loadingSchools: boolean;
}

export function useCategoryHeadsData({
  page,
  limit,
  search,
  selectedSchoolId,
}: UseCategoryHeadsDataParams): UseCategoryHeadsDataReturn {
  // TanStack Query for category heads
  const {
    data: categoryHeadsData,
    isLoading: loadingCategoryHeads,
    refetch: refetchCategoryHeads,
  } = useQuery({
    queryKey: ["categoryHeads", page, limit, search, selectedSchoolId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }

      const response = await api.instance.get("/super-admin/category-heads", {
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

  const categoryHeads: CategoryHead[] = useMemo(
    () => categoryHeadsData?.data || [],
    [categoryHeadsData]
  );

  const paginationMeta: PaginationMeta | null = useMemo(
    () => categoryHeadsData?.meta || null,
    [categoryHeadsData]
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
    categoryHeads,
    paginationMeta,
    loadingCategoryHeads,
    refetchCategoryHeads,
    schools,
    loadingSchools,
  };
}

