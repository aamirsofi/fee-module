import { useMemo, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { feePlanService } from "../../../services/feePlanService";
import { schoolService, School } from "../../../services/schoolService";
import { FeeStructure, FeeCategory, CategoryHead } from "../../../types";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseFeePlanDataParams {
  page: number;
  limit: number;
  search: string;
  selectedSchoolId: string | number;
  formSchoolId: string | number;
}

interface UseFeePlanDataReturn {
  // Fee Structures
  feeStructures: FeeStructure[];
  paginationMeta: PaginationMeta | null;
  loadingFeeStructures: boolean;
  refetchFeeStructures: () => void;

  // Fee Categories
  feeCategories: FeeCategory[];
  loadingCategories: boolean;

  // Schools
  schools: School[];
  loadingSchools: boolean;

  // Category Heads
  categoryHeads: CategoryHead[];
  loadingCategoryHeads: boolean;

  // Classes
  classOptions: Array<{ id: number; name: string }>;
  availableClasses: string[];
  loadingClasses: boolean;
}

export function useFeePlanData({
  page,
  limit,
  search,
  selectedSchoolId,
  formSchoolId,
}: UseFeePlanDataParams): UseFeePlanDataReturn {
  // TanStack Query for fee structures
  const {
    data: feeStructuresData,
    isLoading: loadingFeeStructures,
    refetch: refetchFeeStructures,
  } = useQuery({
    queryKey: ["feeStructures", page, limit, search, selectedSchoolId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }

      const response = await api.instance.get("/super-admin/fee-structures", {
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

  const feeStructures: FeeStructure[] = useMemo(
    () => feeStructuresData?.data || [],
    [feeStructuresData?.data]
  );
  const paginationMeta: PaginationMeta | null = feeStructuresData?.meta || null;

  // TanStack Query for fee categories
  const { data: feeCategoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["feeCategories", formSchoolId],
    queryFn: async () => {
      const response = await feePlanService.getFeeCategories({
        schoolId: formSchoolId as string,
        limit: 1000,
        page: 1,
      });
      // Handle both paginated and direct array responses
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      return [];
    },
    enabled: !!formSchoolId,
  });

  const feeCategories: FeeCategory[] = feeCategoriesData || [];

  // TanStack Query for schools with infinite pagination
  const {
    data: schoolsQueryData,
    isLoading: loadingSchools,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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

  // Flatten all pages into a single array
  const schools: School[] = useMemo(() => {
    if (!schoolsQueryData?.pages) return [];
    return schoolsQueryData.pages.flatMap((page) => page.data || []);
  }, [schoolsQueryData]);

  // Automatically fetch all pages on mount
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // TanStack Query for category heads
  const { data: categoryHeadsData, isLoading: loadingCategoryHeads } = useQuery({
    queryKey: ["categoryHeads", formSchoolId],
    queryFn: async () => {
      if (!formSchoolId) return [];
      const response = await api.instance.get("/super-admin/category-heads", {
        params: {
          schoolId: formSchoolId,
          limit: 1000,
          status: "active",
        },
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: !!formSchoolId,
  });

  const categoryHeads: CategoryHead[] = categoryHeadsData || [];

  // TanStack Query for classes
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", formSchoolId],
    queryFn: async () => {
      if (!formSchoolId) return { classes: [], classNames: [] };

      const response = await api.instance.get("/classes", {
        params: {
          schoolId: formSchoolId,
          limit: 1000,
          page: 1,
        },
      });

      let classes: Array<{ id: number; name: string }> = [];
      let classNames: string[] = [];

      if (response.data.data && Array.isArray(response.data.data)) {
        classes = response.data.data.map((cls: { id: number; name: string }) => ({
          id: cls.id,
          name: cls.name,
        }));
        classNames = response.data.data.map((cls: { id: number; name: string }) => cls.name);
      } else if (Array.isArray(response.data)) {
        classes = response.data.map((cls: { id: number; name: string }) => ({
          id: cls.id,
          name: cls.name,
        }));
        classNames = response.data.map((cls: { id: number; name: string }) => cls.name);
      }

      return { classes, classNames };
    },
    enabled: !!formSchoolId,
  });

  const classOptions: Array<{ id: number; name: string }> =
    classesData?.classes || [];
  const availableClasses: string[] = classesData?.classNames || [];

  return {
    feeStructures,
    paginationMeta,
    loadingFeeStructures,
    refetchFeeStructures,
    feeCategories,
    loadingCategories,
    schools,
    loadingSchools,
    categoryHeads,
    loadingCategoryHeads,
    classOptions,
    availableClasses,
    loadingClasses,
  };
}

