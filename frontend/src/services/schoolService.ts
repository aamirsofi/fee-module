import api from "./api";

export interface School {
  id: number;
  name: string;
  subdomain: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: null;
  settings?: null;
  status: string;
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SchoolResponse {
  data: School[];
  meta: Meta;
}

export const schoolService = {
    getSchools: async (params: { page: number, limit: number, status: string, search?: string }): Promise<SchoolResponse> => {
    const response = await api.instance.get("/super-admin/schools", {
      params: { page: params.page, limit: params.limit, status: params.status, search: params.search || undefined },
    });
    console.log('Schools response:', response.data);
    return response.data as SchoolResponse;
  }
};