export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  schoolId?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

