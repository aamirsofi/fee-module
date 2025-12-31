import { useMemo, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { schoolService, School } from "../../../services/schoolService";
import { routeService } from "../../../services/routeService";
import { RoutePlan, FeeCategory, CategoryHead, Route } from "../../../types";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseRoutePlanDataParams {
  page: number;
  limit: number;
  search: string;
  selectedSchoolId: string | number;
  formSchoolId: string | number;
}

interface UseRoutePlanDataReturn {
  // Route Plans
  routePlans: RoutePlan[];
  paginationMeta: PaginationMeta | null;
  loadingRoutePlans: boolean;
  refetchRoutePlans: () => void;

  // Routes
  routes: Route[];
  loadingRoutes: boolean;

  // Transport Fee Categories (Fee Headings of type transport)
  transportFeeCategories: FeeCategory[];
  loadingTransportCategories: boolean;

  // Category Heads
  categoryHeads: CategoryHead[];
  loadingCategoryHeads: boolean;

  // Classes
  classOptions: Array<{ id: number; name: string }>;
  availableClasses: string[];
  loadingClasses: boolean;

  // Schools
  schools: School[];
  loadingSchools: boolean;
}

export function useRoutePlanData({
  page,
  limit,
  search,
  selectedSchoolId,
  formSchoolId,
}: UseRoutePlanDataParams): UseRoutePlanDataReturn {
  // TanStack Query for route plans
  const {
    data: routePlansData,
    isLoading: loadingRoutePlans,
    refetch: refetchRoutePlans,
  } = useQuery({
    queryKey: ["routePlans", page, limit, search, selectedSchoolId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }

      const response = await api.instance.get("/super-admin/route-plans", {
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

  const routePlans: RoutePlan[] = useMemo(
    () => routePlansData?.data || [],
    [routePlansData?.data]
  );
  const paginationMeta: PaginationMeta | null = routePlansData?.meta || null;

  // TanStack Query for routes (for form dropdown)
  const { data: routesData, isLoading: loadingRoutes } = useQuery({
    queryKey: ["routes", formSchoolId],
    queryFn: async () => {
      if (!formSchoolId) return { data: [], meta: null };
      const response = await routeService.getRoutes({
        page: 1,
        limit: 1000,
        schoolId: formSchoolId as string | number,
        status: "active",
      });
      return response;
    },
    enabled: !!formSchoolId,
  });

  const routes: Route[] = useMemo(() => {
    if (!routesData?.data) return [];
    return routesData.data;
  }, [routesData]);

  // TanStack Query for transport fee categories (Fee Headings of type transport)
  const { data: transportCategoriesData, isLoading: loadingTransportCategories } = useQuery({
    queryKey: ["transportFeeCategories", formSchoolId],
    queryFn: async () => {
      if (!formSchoolId) return [];
      const params: Record<string, string | number> = {
        page: 1,
        limit: 1000,
        schoolId: formSchoolId,
        type: "transport",
      };

      const response = await api.instance.get("/super-admin/fee-categories", {
        params,
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.filter((cat: FeeCategory) => cat.type === "transport");
      } else if (Array.isArray(response.data)) {
        return response.data.filter((cat: FeeCategory) => cat.type === "transport");
      }
      return [];
    },
    enabled: !!formSchoolId,
  });

  const transportFeeCategories: FeeCategory[] = transportCategoriesData || [];

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

  return {
    routePlans,
    paginationMeta,
    loadingRoutePlans,
    refetchRoutePlans,
    routes,
    loadingRoutes,
    transportFeeCategories,
    loadingTransportCategories,
    categoryHeads,
    loadingCategoryHeads,
    classOptions,
    availableClasses,
    loadingClasses,
    schools,
    loadingSchools,
  };
}

