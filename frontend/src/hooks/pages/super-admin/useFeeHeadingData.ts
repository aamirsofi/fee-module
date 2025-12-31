import { useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { schoolService, School } from "../../../services/schoolService";

export interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  type: "school" | "transport";
  status: string;
  applicableMonths?: number[];
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

interface UseFeeHeadingDataParams {
  page: number;
  limit: number;
  search: string;
  selectedSchoolId: string | number;
  selectedType: string;
}

interface UseFeeHeadingDataReturn {
  // Fee Categories
  feeCategories: FeeCategory[];
  paginationMeta: PaginationMeta | null;
  loadingFeeCategories: boolean;
  refetchFeeCategories: () => void;

  // Schools
  schools: School[];
  loadingSchools: boolean;
}

export function useFeeHeadingData({
  page,
  limit,
  search,
  selectedSchoolId,
  selectedType,
}: UseFeeHeadingDataParams): UseFeeHeadingDataReturn {
  // TanStack Query for fee categories
  const {
    data: feeCategoriesData,
    isLoading: loadingFeeCategories,
    refetch,
  } = useQuery({
    queryKey: ["feeCategories", page, limit, search, selectedSchoolId, selectedType],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }
      if (selectedType) {
        params.type = selectedType;
      }

      const response = await api.instance.get("/super-admin/fee-categories", {
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

  const feeCategories: FeeCategory[] = useMemo(
    () => feeCategoriesData?.data || [],
    [feeCategoriesData]
  );

  const paginationMeta: PaginationMeta | null = useMemo(
    () => feeCategoriesData?.meta || null,
    [feeCategoriesData]
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

  const refetchFeeCategories = () => {
    void refetch();
  };

  return {
    feeCategories,
    paginationMeta,
    loadingFeeCategories,
    refetchFeeCategories,
    schools,
    loadingSchools,
  };
}

