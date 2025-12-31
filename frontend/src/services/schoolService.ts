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
  /**
   * Get schools - defaults to active schools only to prevent adding data to inactive/suspended schools
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.limit - Items per page (default: 100)
   * @param params.status - School status filter (default: "active")
   * @param params.search - Search query (optional)
   * @param params.includeInactive - Include inactive/suspended schools (default: false)
   */
  getSchools: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<SchoolResponse> => {
    // Default to active schools only to prevent accidental data addition to inactive schools
    const status = params.status || "active";
    const includeInactive = params.includeInactive || false;

    const response = await api.instance.get("/super-admin/schools", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        status: status !== "all" ? status : undefined,
        search: params.search || undefined,
        includeInactive: includeInactive ? "true" : undefined,
      },
    });
    return response.data as SchoolResponse;
  },
};