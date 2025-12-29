import api from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.instance.post<AuthResponse>(
      '/auth/login',
      credentials,
    );
    return response.data;
  },

  async register(data: RegisterData): Promise<{ message: string; user: any }> {
    const response = await api.instance.post('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<any> {
    const response = await api.instance.get('/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

