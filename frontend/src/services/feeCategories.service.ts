import api from './api';
import { FeeCategory } from '../types';

export const feeCategoriesService = {
  async getAll(schoolId?: number): Promise<FeeCategory[]> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<FeeCategory[]>('/fee-categories', { params });
    return response.data;
  },

  async getById(id: number): Promise<FeeCategory> {
    const response = await api.instance.get<FeeCategory>(`/fee-categories/${id}`);
    return response.data;
  },

  async create(data: Partial<FeeCategory>): Promise<FeeCategory> {
    const response = await api.instance.post<FeeCategory>('/fee-categories', data);
    return response.data;
  },

  async update(id: number, data: Partial<FeeCategory>): Promise<FeeCategory> {
    const response = await api.instance.patch<FeeCategory>(`/fee-categories/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/fee-categories/${id}`);
  },
};

