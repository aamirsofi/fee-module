import api from './api';
import { Student } from '../types';

export const studentsService = {
  async getAll(schoolId?: number): Promise<Student[]> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<Student[]>('/students', { params });
    return response.data;
  },

  async getById(id: number): Promise<Student> {
    const response = await api.instance.get<Student>(`/students/${id}`);
    return response.data;
  },

  async create(data: Partial<Student>, schoolId?: number): Promise<Student> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.post<Student>('/students', data, { params });
    return response.data;
  },

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const response = await api.instance.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/students/${id}`);
  },

  async getLastStudentId(schoolId?: number): Promise<{ lastStudentId: number | null; nextStudentId: number }> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<{ lastStudentId: number | null; nextStudentId: number }>('/students/last-id', { params });
    return response.data;
  },
};

