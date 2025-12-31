import api from "./api";

interface FeePlan {
  id: string;
  name: string;
  description: string;
  amount: number;
}

export const feePlanService = {
  getFeeCategories: async (params: { schoolId: string; limit: number; page: number }) => {
    const response = await api.instance.get(`/super-admin/fee-categories`, {
      params: {
        schoolId: params.schoolId,
        limit: params.limit,
        page: params.page,
      },
    });
    return response.data;
  },
  createFeePlan: async (feePlan: FeePlan) => {
    const response = await api.instance.post("/fee-plans", feePlan);
    return response.data;
  },
  updateFeePlan: async (id: string, feePlan: FeePlan) => {
    const response = await api.instance.put(`/fee-plans/${id}`, feePlan);
    return response.data;
  },
};