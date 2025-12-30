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

export interface School {
  id: number;
  name: string;
  subdomain: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  settings?: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended';
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  class: string;
  section?: string;
  status: 'active' | 'inactive' | 'graduated';
  schoolId: number;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export type FeeCategoryType = 'school' | 'transport';

export type CategoryHead = 'general' | 'sponsored';

export interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  type: FeeCategoryType;
  status: 'active' | 'inactive';
  applicableMonths?: number[]; // Array of month numbers (1-12)
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: number;
  name: string;
  description?: string;
  amount: number;
  categoryId: number;
  academicYear: string;
  dueDate?: string;
  applicableClasses?: string[];
  status: 'active' | 'inactive';
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  studentId: number;
  feeStructureId: number;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'online';
  paymentDate: string;
  receiptNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

