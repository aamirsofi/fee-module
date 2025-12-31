import api from "./api";
import { RoutePlan } from "../types";

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RoutePlanResponse {
  data: RoutePlan[];
  meta: Meta;
}

export const routePlanService = {
  getRoutePlans: async (params: {
    page: number;
    limit: number;
    schoolId?: string | number;
    search?: string;
    routeId?: number;
    feeCategoryId?: number;
    categoryHeadId?: number;
    classId?: number;
  }): Promise<RoutePlanResponse> => {
    const response = await api.instance.get("/super-admin/route-plans", {
      params: {
        page: params.page,
        limit: params.limit,
        schoolId: params.schoolId || undefined,
        search: params.search || undefined,
        routeId: params.routeId || undefined,
        feeCategoryId: params.feeCategoryId || undefined,
        categoryHeadId: params.categoryHeadId || undefined,
        classId: params.classId || undefined,
      },
    });
    return response.data as RoutePlanResponse;
  },

  createRoutePlan: async (
    schoolId: string | number,
    data: {
      routeId: number;
      feeCategoryId: number;
      categoryHeadId?: number;
      classId?: number;
      name: string;
      description?: string;
      amount: number;
      status?: string;
    }
  ): Promise<RoutePlan> => {
    const response = await api.instance.post(
      `/super-admin/route-plans?schoolId=${schoolId}`,
      data
    );
    return response.data as RoutePlan;
  },

  updateRoutePlan: async (
    id: number,
    schoolId: string | number,
    data: {
      routeId?: number;
      feeCategoryId?: number;
      categoryHeadId?: number;
      classId?: number;
      name?: string;
      description?: string;
      amount?: number;
      status?: string;
    }
  ): Promise<RoutePlan> => {
    const response = await api.instance.patch(
      `/super-admin/route-plans/${id}?schoolId=${schoolId}`,
      data
    );
    return response.data as RoutePlan;
  },

  deleteRoutePlan: async (id: number, schoolId: string | number): Promise<void> => {
    await api.instance.delete(`/super-admin/route-plans/${id}?schoolId=${schoolId}`);
  },
};

