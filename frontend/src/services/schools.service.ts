import api from './api';
import { School } from '../types';

export const schoolsService = {
  /**
   * Get all schools - defaults to active schools only
   * Note: This endpoint is for school admins. For super admin, use schoolService.getSchools()
   */
  async getAll(): Promise<School[]> {
    // Default to active schools only to prevent adding data to inactive schools
    const response = await api.instance.get<School[]>('/schools', {
      params: { status: 'active' },
    });
    return response.data;
  },

  async getById(id: number): Promise<School> {
    const response = await api.instance.get<School>(`/schools/${id}`);
    return response.data;
  },

  async create(data: Partial<School>): Promise<School> {
    const response = await api.instance.post<School>('/schools', data);
    return response.data;
  },

  async update(id: number, data: Partial<School>): Promise<School> {
    const response = await api.instance.patch<School>(`/schools/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/schools/${id}`);
  },
};

