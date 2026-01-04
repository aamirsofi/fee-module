import api from './api';

export interface GenerateFeesDto {
  studentIds?: number[];
  classIds?: number[];
  academicYearId: number;
  feeStructureIds: number[];
  dueDate: string;
  schoolId?: number; // Required for super_admin, optional for others
  discount?: {
    percentage?: number;
    fixedAmount?: number;
  };
  installment?: {
    enabled: boolean;
    count?: number;
    startDate?: string;
  };
  regenerateExisting?: boolean;
}

export interface FeeGenerationResult {
  success: boolean;
  generated: number;
  failed: number;
  historyId: number;
}

export interface FeeGenerationHistory {
  id: number;
  type: 'manual' | 'automatic';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  schoolId: number;
  academicYearId: number;
  totalStudents: number;
  feesGenerated: number;
  feesFailed: number;
  errorMessage?: string;
  generatedBy?: string;
  feeStructureIds?: number[];
  classIds?: number[];
  studentIds?: number[];
  totalAmountGenerated?: number;
  failedStudentDetails?: Array<{ studentId: number; studentName: string; error: string }>;
  createdAt: string;
  academicYear?: {
    id: number;
    name: string;
  };
  school?: {
    id: number;
    name: string;
  };
  feeStructures?: Array<{
    id: number;
    name: string;
    amount: number;
    category?: { name: string };
    class?: { name: string };
  }>;
}

const feeGenerationService = {
  /**
   * Generate fees for students
   */
  async generateFees(data: GenerateFeesDto): Promise<FeeGenerationResult> {
    console.log('Calling fee generation API with data:', JSON.stringify(data, null, 2));
    try {
      const response = await api.instance.post<FeeGenerationResult>(
        '/fee-generation/generate',
        data,
      );
      console.log('Fee generation API response status:', response.status);
      console.log('Fee generation API response data:', response.data);
      
      // Handle both direct response and wrapped response
      if (response.data && typeof response.data === 'object') {
        // Check if response is wrapped in data field
        if ('data' in response.data && typeof response.data.data === 'object') {
          return response.data.data;
        }
        // Check if it's a standard API response format
        if ('success' in response.data && 'data' in response.data) {
          return response.data.data;
        }
        // Direct response
        return response.data;
      }
      return response.data;
    } catch (error: any) {
      console.error('Fee generation API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  /**
   * Get fee generation history
   */
  async getHistory(limit: number = 50, schoolId?: number): Promise<FeeGenerationHistory[]> {
    const response = await api.instance.get<FeeGenerationHistory[]>(
      '/fee-generation/history',
      {
        params: { limit, ...(schoolId && { schoolId }) },
      },
    );
    return response.data;
  },

  /**
   * Get detailed fee generation history by ID
   */
  async getHistoryDetails(id: number, schoolId?: number): Promise<FeeGenerationHistory> {
    const response = await api.instance.get<FeeGenerationHistory>(
      `/fee-generation/history/${id}`,
      {
        params: { ...(schoolId && { schoolId }) },
      },
    );
    return response.data;
  },
};

export default feeGenerationService;


