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
  schoolId: number;
  feeCategoryId: number;
  categoryHeadId?: number;
  name: string;
  description?: string;
  amount: number;
  classId?: number;
  academicYear: string;
  dueDate?: string;
  status: 'active' | 'inactive';
  category?: FeeCategory;
  categoryHead?: CategoryHead;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryHead {
  id: number;
  schoolId: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
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

