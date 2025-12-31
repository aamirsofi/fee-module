import api from "./api";
import { Route } from "../types";

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RouteResponse {
  data: Route[];
  meta: Meta;
}

export const routeService = {
  getRoutes: async (params: {
    page: number;
    limit: number;
    schoolId?: string | number;
    search?: string;
    status?: string;
  }): Promise<RouteResponse> => {
    const response = await api.instance.get("/super-admin/routes", {
      params: {
        page: params.page,
        limit: params.limit,
        schoolId: params.schoolId || undefined,
        search: params.search || undefined,
        status: params.status || undefined,
      },
    });
    return response.data as RouteResponse;
  },

  createRoute: async (
    schoolId: string | number,
    data: {
      name: string;
      description?: string;
      status?: string;
    }
  ): Promise<Route> => {
    const response = await api.instance.post(
      `/super-admin/routes?schoolId=${schoolId}`,
      data
    );
    return response.data as Route;
  },

  updateRoute: async (
    id: number,
    schoolId: string | number,
    data: {
      name?: string;
      description?: string;
      status?: string;
    }
  ): Promise<Route> => {
    const response = await api.instance.patch(
      `/super-admin/routes/${id}?schoolId=${schoolId}`,
      data
    );
    return response.data as Route;
  },

  deleteRoute: async (id: number, schoolId: string | number): Promise<void> => {
    await api.instance.delete(`/super-admin/routes/${id}?schoolId=${schoolId}`);
  },
};

