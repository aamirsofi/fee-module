import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle2, XCircle, Clock, Loader, Search, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import feeGenerationService, {
  GenerateFeesDto,
  FeeGenerationHistory,
} from '../../services/feeGenerationService';
import { academicYearsService } from '../../services/academicYears.service';
import api from '../../services/api';
import { getErrorMessage } from '@/utils/errorHandling';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';
import { FiLoader, FiSearch, FiPlus } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';

interface StudentDetails {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  class?: {
    id: number;
    name: string;
  };
  categoryHead?: {
    id: number;
    name: string;
  };
  route?: {
    id: number;
    name: string;
  };
  routeId?: number;
  openingBalance?: number;
}

interface FeeBreakdown {
  feeHead: string;
  feeStructureId: number;
  monthlyAmounts: Record<string, number>; // month key -> amount
  total: number;
  received: number;
  balance: number;
}

export default function FeeGeneration() {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchool();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearchId, setStudentSearchId] = useState('');
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [historyDetails, setHistoryDetails] = useState<FeeGenerationHistory | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch academic years
  const { data: academicYears = [], isLoading: loadingAcademicYears } = useQuery({
    queryKey: ['academicYears', selectedSchoolId],
    queryFn: () => academicYearsService.getAll(selectedSchoolId || undefined),
    enabled: !!selectedSchoolId,
  });

  // Set current academic year as default
  useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      if (currentYear) {
        setAcademicYearId(currentYear.id);
      } else {
        setAcademicYearId(academicYears[0].id);
      }
    }
  }, [academicYears, academicYearId]);

  // Fetch generation history
  const { data: generationHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['feeGenerationHistory', selectedSchoolId],
    queryFn: () => feeGenerationService.getHistory(50, selectedSchoolId || undefined),
    enabled: !!selectedSchoolId,
  });

  // Search student by ID
  const handleSearchStudent = async () => {
    if (!studentSearchId.trim() || !selectedSchoolId || !academicYearId) {
      setError('Please enter a student ID and ensure school and academic year are selected');
      return;
    }

    setLoadingStudent(true);
    setError('');
    setStudentDetails(null);
    setFeeBreakdown([]);

    try {
      // Search student by studentId
      const response = await api.instance.get('/students', {
        params: { schoolId: selectedSchoolId, studentId: studentSearchId.trim() },
      });

      const students = extractArrayData<any>(response);
      console.log('Search results:', students);
      console.log('Searching for studentId:', studentSearchId.trim());
      console.log('Number of results:', students.length);

      if (students.length === 0) {
        setError(`Student with ID "${studentSearchId.trim()}" not found`);
        setStudentDetails(null);
        setFeeBreakdown([]);
        return;
      }

      // Find exact match by studentId (not database ID)
      const student = students.find((s: any) => s.studentId === studentSearchId.trim());
      
      if (!student) {
        console.warn('No exact match found, students returned:', students.map((s: any) => ({ id: s.id, studentId: s.studentId })));
        setError(`Student with ID "${studentSearchId.trim()}" not found. Found ${students.length} similar results.`);
        setStudentDetails(null);
        setFeeBreakdown([]);
        return;
      }

      console.log('Found exact match student:', student);

      // Get student details with relations
      const studentDetailResponse = await api.instance.get(`/students/${student.id}`, {
        params: { schoolId: selectedSchoolId },
      });

      // Handle both direct response and wrapped response
      const studentData = extractApiData<any>(studentDetailResponse) || studentDetailResponse.data;
      console.log('Student details:', studentData);

      // Get academic record for the academic year
      const academicRecordResponse = await api.instance.get('/student-academic-records', {
        params: { studentId: student.id, academicYearId },
      });

      const records = extractArrayData<any>(academicRecordResponse);
      const academicRecord = records.length > 0 ? records[0] : null;

      // Pre-check: Verify student has required information
      const missingFields: string[] = [];
      if (!academicRecord?.class || !academicRecord?.classId) {
        missingFields.push('Class');
      }
      if (!studentData.categoryHead || !studentData.categoryHeadId) {
        missingFields.push('Fee Category');
      }
      if (!studentData.route || !studentData.routeId) {
        missingFields.push('Route');
      }

      if (missingFields.length > 0) {
        setError(
          `Student is missing required information: ${missingFields.join(', ')}. ` +
          `Please update the student profile first before generating fees.`
        );
        setStudentDetails(null);
        setFeeBreakdown([]);
        setLoadingStudent(false);
        return;
      }

      setStudentDetails({
        id: studentData.id,
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        address: studentData.address,
        class: academicRecord?.class,
        categoryHead: studentData.categoryHead,
        route: studentData.route,
        routeId: studentData.routeId,
        openingBalance: studentData.openingBalance || 0,
      });

      // Generate fee breakdown
      await generateFeeBreakdown(studentData.id, academicYearId, academicRecord?.classId);
    } catch (err: any) {
      console.error('Error searching student:', err);
      setError(getErrorMessage(err, 'Failed to search student'));
    } finally {
      setLoadingStudent(false);
    }
  };

  // Generate fee breakdown
  const generateFeeBreakdown = async (
    studentId: number,
    academicYearId: number,
    classId?: number,
  ) => {
    if (!classId || !selectedSchoolId) return;

    setLoadingBreakdown(true);
    try {
      // Get academic year details
      const academicYear = academicYears.find((y) => y.id === academicYearId);
      if (!academicYear) return;

      // Pre-check: Verify student has required information
      if (!studentDetails?.class || !classId) {
        setError('Student must have a class assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      if (!studentDetails?.categoryHead || !studentDetails?.categoryHead?.id) {
        setError('Student must have a fee category assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      if (!studentDetails?.route || !studentDetails?.routeId) {
        setError('Student must have a route assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      const categoryHeadId = studentDetails.categoryHead.id;
      const routeId = studentDetails.routeId;

      // Get fee structures for the class AND category
      const feeStructuresResponse = await api.instance.get('/fee-structures', {
        params: { 
          schoolId: selectedSchoolId, 
          classId, 
          categoryHeadId, // Filter by category
          status: 'active' 
        },
      });

      const feeStructures = extractArrayData<any>(feeStructuresResponse);
      console.log(`Fee structures found for class ${classId} and category ${categoryHeadId}:`, feeStructures);
      
      if (feeStructures.length === 0) {
        setError(
          `No fee structures found for class "${studentDetails.class?.name || classId}" ` +
          `and category "${studentDetails.categoryHead?.name || categoryHeadId}". ` +
          `Please create fee plans for this class and category combination first.`
        );
        setLoadingBreakdown(false);
        return;
      }

      // Get existing student fees
      let existingFees: any[] = [];
      try {
        const existingFeesResponse = await api.instance.get('/student-fee-structures', {
          params: { studentId, academicYearId },
        });
        existingFees = extractArrayData<any>(existingFeesResponse);
        console.log('Existing fees found:', existingFees);
      } catch (err) {
        console.warn('Failed to fetch existing fees (continuing anyway):', err);
        // Continue without existing fees - will show balance as full amount
      }

      // Calculate months from academic year start to previous month
      const academicYearStart = new Date(academicYear.startDate);
      const previousMonth = subMonths(new Date(), 1);
      const months = eachMonthOfInterval({
        start: startOfMonth(academicYearStart),
        end: endOfMonth(previousMonth),
      });

      // Build fee breakdown
      const breakdown: FeeBreakdown[] = [];

      // Add opening balance as Ledger Balance (include if non-zero, whether positive or negative)
      // Positive = debt (student owes), Negative = credit (student has credit)
      if (studentDetails?.openingBalance !== undefined && studentDetails.openingBalance !== null) {
        const openingBalance = parseFloat(studentDetails.openingBalance.toString());
        if (openingBalance !== 0) {
          breakdown.push({
            feeHead: openingBalance > 0 ? 'Ledger Balance (Outstanding)' : 'Ledger Balance (Credit)',
            feeStructureId: 0,
            monthlyAmounts: {},
            total: openingBalance,
            received: 0,
            balance: openingBalance,
          });
        }
      }

      // Process each fee structure
      for (const feeStructure of feeStructures) {
        // Get fee category to check applicable months
        let applicableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to all months
        try {
          const categoryResponse = await api.instance.get(
            `/fee-categories/${feeStructure.feeCategoryId}`,
          );
          const category = extractApiData<any>(categoryResponse) || categoryResponse.data;
          applicableMonths = category?.applicableMonths || applicableMonths;
          console.log(`Category for fee structure ${feeStructure.id}:`, category);
        } catch (err) {
          console.warn(`Failed to fetch category for fee structure ${feeStructure.id}:`, err);
          // Use default months if category fetch fails
        }

        const monthlyAmounts: Record<string, number> = {};
        let total = 0;

        // Calculate monthly amounts based on applicable months
        months.forEach((month) => {
          const monthNumber = month.getMonth() + 1; // 1-12
          if (applicableMonths.includes(monthNumber)) {
            const monthKey = format(month, 'MMM yy');
            const amount = parseFloat(feeStructure.amount.toString());
            monthlyAmounts[monthKey] = amount;
            total += amount;
          }
        });

        // Calculate received and balance from existing fees
        const existingFee = existingFees.find((f) => f.feeStructureId === feeStructure.id);
        const received = existingFee
          ? parseFloat(existingFee.amount.toString())
          : 0;

        breakdown.push({
          feeHead: feeStructure.name,
          feeStructureId: feeStructure.id,
          monthlyAmounts,
          total,
          received,
          balance: total - received,
        });
      }

      // Find and add bus fee based on student's route and class
      if (studentDetails?.routeId && classId) {
        try {
          // Find route plan by routeId and classId
          const routePlansResponse = await api.instance.get('/super-admin/route-plans', {
            params: {
              schoolId: selectedSchoolId,
              routeId: studentDetails.routeId,
              classId: classId,
            },
          });

          const routePlans = extractArrayData<any>(routePlansResponse);

          // Find matching route plan (prefer class-specific, fallback to general)
          const routePlan =
            routePlans.find((rp) => rp.classId === classId) ||
            routePlans.find((rp) => !rp.classId) ||
            routePlans[0];

          if (routePlan) {
            const busFeeAmount = parseFloat(routePlan.amount.toString());
            const monthlyAmounts: Record<string, number> = {};
            let total = 0;

            // Get transport fee category to check applicable months
            try {
              const transportCategoryResponse = await api.instance.get(
                `/fee-categories/${routePlan.feeCategoryId}`,
              );
              const transportCategory = transportCategoryResponse.data;
              const applicableMonths =
                transportCategory?.applicableMonths ||
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to all months

              months.forEach((month) => {
                const monthNumber = month.getMonth() + 1; // 1-12
                if (applicableMonths.includes(monthNumber)) {
                  const monthKey = format(month, 'MMM yy');
                  monthlyAmounts[monthKey] = busFeeAmount;
                  total += busFeeAmount;
                }
              });
            } catch {
              // If category fetch fails, apply to all months
              months.forEach((month) => {
                const monthKey = format(month, 'MMM yy');
                monthlyAmounts[monthKey] = busFeeAmount;
                total += busFeeAmount;
              });
            }

            breakdown.push({
              feeHead: 'Transport Fee',
              feeStructureId: 0,
              monthlyAmounts,
              total,
              received: 0,
              balance: total,
            });
          }
        } catch (err) {
          console.error('Error fetching route plan:', err);
          // Continue without bus fee if route plan not found
        }
      }

      console.log('Fee breakdown generated:', breakdown);
      console.log('Breakdown length:', breakdown.length);
      // Log each item in breakdown for debugging
      breakdown.forEach((item, index) => {
        console.log(`Breakdown item ${index}:`, {
          feeHead: item.feeHead,
          feeStructureId: item.feeStructureId,
          total: item.total,
        });
      });
      setFeeBreakdown(breakdown);
    } catch (err: any) {
      console.error('Error generating fee breakdown:', err);
      setError(getErrorMessage(err, 'Failed to generate fee breakdown'));
      setFeeBreakdown([]); // Clear breakdown on error
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Generate fees mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateFeesDto) => feeGenerationService.generateFees(data),
    onSuccess: (result) => {
      console.log('Fee generation success result:', result);
      // Handle both direct result and wrapped result
      const finalResult = result && typeof result === 'object' && 'data' in result 
        ? result.data 
        : result;
      
      if (!finalResult || typeof finalResult !== 'object') {
        console.error('Invalid result format:', finalResult);
        setError('Invalid response from server');
        return;
      }

      const generated = finalResult.generated || 0;
      const failed = finalResult.failed || 0;
      
      if (generated === 0 && failed === 0) {
        setError('No fees were generated. Fees may already exist for this student.');
      } else {
        setSuccess(
          `Successfully generated ${generated} fees. ${failed > 0 ? `${failed} failed.` : ''}`,
        );
      }
      setError('');
      queryClient.invalidateQueries({ queryKey: ['feeGenerationHistory'] });
      // Refresh fee breakdown
      if (studentDetails && academicYearId) {
        generateFeeBreakdown(
          studentDetails.id,
          academicYearId,
          studentDetails.class?.id,
        );
      }
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (error: any) => {
      console.error('Fee generation error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = getErrorMessage(error, 'Failed to generate fees');
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      setSuccess('');
      setTimeout(() => setError(''), 10000); // Show error for 10 seconds
    },
  });

  const handleGenerateFees = () => {
    if (!studentDetails || !academicYearId) {
      setError('Please search for a student first');
      return;
    }

    if (feeBreakdown.length === 0) {
      setError('No fees to generate. Please ensure fee breakdown is loaded.');
      return;
    }

    // Get fee structure IDs from breakdown (excluding opening balance and bus fee)
    const feeStructureIds = feeBreakdown
      .filter((f) => f.feeStructureId > 0)
      .map((f) => f.feeStructureId);

    console.log('Fee breakdown:', feeBreakdown);
    console.log('Fee structure IDs to generate:', feeStructureIds);

    if (feeStructureIds.length === 0) {
      setError('No fee structures to generate. Please ensure fee plans are assigned to this class.');
      return;
    }

    if (!selectedSchoolId) {
      setError('School ID is required. Please select a school.');
      return;
    }

    const data: GenerateFeesDto = {
      studentIds: [studentDetails.id],
      academicYearId,
      feeStructureIds,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      schoolId: selectedSchoolId || undefined, // Include schoolId for super_admin
      regenerateExisting: true, // Allow regenerating existing fees
    };

    console.log('Generating fees with data:', JSON.stringify(data, null, 2));
    generateMutation.mutate(data);
  };

  // Calculate month columns
  const monthColumns = useMemo(() => {
    if (!academicYearId || academicYears.length === 0) return [];
    const academicYear = academicYears.find((y) => y.id === academicYearId);
    if (!academicYear) return [];

    const academicYearStart = new Date(academicYear.startDate);
    const previousMonth = subMonths(new Date(), 1);
    const months = eachMonthOfInterval({
      start: startOfMonth(academicYearStart),
      end: endOfMonth(previousMonth),
    });

    return months.map((month) => format(month, 'MMM yy'));
  }, [academicYearId, academicYears]);

  // Calculate totals
  const totals = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let grandTotal = 0;
    let grandReceived = 0;
    let grandBalance = 0;

    monthColumns.forEach((month) => {
      monthlyTotals[month] = 0;
    });

    feeBreakdown.forEach((fee) => {
      grandTotal += fee.total;
      grandReceived += fee.received;
      grandBalance += fee.balance;
      monthColumns.forEach((month) => {
        monthlyTotals[month] += fee.monthlyAmounts[month] || 0;
      });
    });

    return { monthlyTotals, grandTotal, grandReceived, grandBalance };
  }, [feeBreakdown, monthColumns]);

  // Load history details
  const loadHistoryDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const details = await feeGenerationService.getHistoryDetails(id, selectedSchoolId || undefined);
      setHistoryDetails(details);
    } catch (err) {
      console.error('Error loading history details:', err);
      setError(getErrorMessage(err, 'Failed to load history details'));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter history by status
  const filteredHistory = useMemo(() => {
    if (statusFilter === 'all') return generationHistory;
    return generationHistory.filter((h) => h.status === statusFilter);
  }, [generationHistory, statusFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Type', 'Status', 'Academic Year', 'Total Students', 'Generated', 'Failed', 'Total Amount', 'Generated By', 'Date'];
    const rows = filteredHistory.map((h) => [
      h.type,
      h.status,
      h.academicYear?.name || h.academicYearId,
      h.totalStudents,
      h.feesGenerated,
      h.feesFailed,
      h.totalAmountGenerated ? `₹${h.totalAmountGenerated.toLocaleString()}` : '-',
      h.generatedBy || 'System',
      new Date(h.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee-generation-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const historyColumns: ColumnDef<FeeGenerationHistory>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={type === 'automatic' ? 'secondary' : 'default'}>
            {type === 'automatic' ? 'Automatic' : 'Manual'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'academicYear',
      header: 'Academic Year',
      cell: ({ row }) => {
        const history = row.original;
        return history.academicYear?.name || `ID: ${history.academicYearId}`;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          pending: { icon: Clock, color: 'text-yellow-500' },
          in_progress: { icon: Loader, color: 'text-blue-500' },
          completed: { icon: CheckCircle2, color: 'text-green-500' },
          failed: { icon: XCircle, color: 'text-red-500' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalStudents',
      header: 'Total Students',
      cell: ({ row }) => row.getValue('totalStudents'),
    },
    {
      accessorKey: 'feesGenerated',
      header: 'Generated',
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">{row.getValue('feesGenerated')}</span>
      ),
    },
    {
      accessorKey: 'feesFailed',
      header: 'Failed',
      cell: ({ row }) => {
        const failed = row.getValue('feesFailed') as number;
        return failed > 0 ? (
          <span className="text-red-600 font-semibold">{failed}</span>
        ) : (
          <span className="text-gray-400">0</span>
        );
      },
    },
    {
      accessorKey: 'totalAmountGenerated',
      header: 'Total Amount',
      cell: ({ row }) => {
        const amount = row.getValue('totalAmountGenerated') as number | undefined;
        return amount ? (
          <span className="font-semibold">₹{amount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: 'generatedBy',
      header: 'Generated By',
      cell: ({ row }) => row.getValue('generatedBy') || 'System',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const history = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedHistoryId(history.id);
              loadHistoryDetails(history.id);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return date.toLocaleString();
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin/finance">Finance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Fee Generation</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Fee Generation
          </CardTitle>
          <CardDescription>
            Search student by ID and generate fees up to previous month
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student</CardTitle>
          <CardDescription>Enter student ID to fetch details and generate fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Academic Year</Label>
              <Select
                value={academicYearId?.toString() || ''}
                onValueChange={(value) => setAcademicYearId(parseInt(value))}
                disabled={loadingAcademicYears}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Student ID</Label>
              <Input
                placeholder="Enter student ID"
                value={studentSearchId}
                onChange={(e) => setStudentSearchId(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchStudent();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearchStudent} disabled={loadingStudent || !studentSearchId.trim()}>
              {loadingStudent ? (
                <>
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FiSearch className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      {studentDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-semibold">
                  {studentDetails.firstName} {studentDetails.lastName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Father Name</Label>
                <p className="font-semibold">{studentDetails.parentName || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Contact Number</Label>
                <p className="font-semibold">{studentDetails.parentPhone || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Address</Label>
                <p className="font-semibold">{studentDetails.address || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Class</Label>
                <p className="font-semibold">{studentDetails.class?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Fee Category</Label>
                <p className="font-semibold">{studentDetails.categoryHead?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Route</Label>
                <p className="font-semibold">{studentDetails.route?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Opening Balance</Label>
                <p className="font-semibold">
                  ₹{studentDetails.openingBalance?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown Table */}
      {studentDetails && feeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
            <CardDescription>Monthly fee breakdown up to previous month</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <FiLoader className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Fee Head</th>
                      {monthColumns.map((month) => (
                        <th key={month} className="text-right p-2 font-semibold">
                          {month}
                        </th>
                      ))}
                      <th className="text-right p-2 font-semibold">Total</th>
                      <th className="text-right p-2 font-semibold">Received</th>
                      <th className="text-right p-2 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeBreakdown.map((fee, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-medium">{fee.feeHead}</td>
                        {monthColumns.map((month) => (
                          <td key={month} className="text-right p-2">
                            {fee.monthlyAmounts[month] ? `₹${fee.monthlyAmounts[month].toLocaleString()}` : '-'}
                          </td>
                        ))}
                        <td className="text-right p-2 font-semibold">
                          ₹{fee.total.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          ₹{fee.received.toLocaleString()}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          ₹{fee.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="p-2">Total Amount</td>
                      {monthColumns.map((month) => (
                        <td key={month} className="text-right p-2">
                          ₹{totals.monthlyTotals[month]?.toLocaleString() || '0'}
                        </td>
                      ))}
                      <td className="text-right p-2">₹{totals.grandTotal.toLocaleString()}</td>
                      <td className="text-right p-2 text-green-600">
                        ₹{totals.grandReceived.toLocaleString()}
                      </td>
                      <td className="text-right p-2 text-red-600">
                        ₹{totals.grandBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleGenerateFees} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <>
                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2 h-4 w-4" />
                    Generate Fees
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>View past fee generation activities</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DataTable
            columns={historyColumns}
            data={filteredHistory}
            loading={loadingHistory}
            searchKey="type"
          />
        </CardContent>
      </Card>

      {/* History Details Modal */}
      <Dialog open={selectedHistoryId !== null} onOpenChange={(open) => !open && setSelectedHistoryId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fee Generation Details</DialogTitle>
            <DialogDescription>
              Detailed information about fee generation #{selectedHistoryId}
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center p-8">
              <FiLoader className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading details...</span>
            </div>
          ) : historyDetails ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <p className="font-semibold capitalize">{historyDetails.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="font-semibold capitalize">{historyDetails.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Academic Year</Label>
                  <p className="font-semibold">{historyDetails.academicYear?.name || `ID: ${historyDetails.academicYearId}`}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Generated By</Label>
                  <p className="font-semibold">{historyDetails.generatedBy || 'System'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <p className="font-semibold">{new Date(historyDetails.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Total Amount Generated</Label>
                  <p className="font-semibold">
                    {historyDetails.totalAmountGenerated
                      ? `₹${historyDetails.totalAmountGenerated.toLocaleString()}`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Label className="text-xs text-gray-500">Total Students</Label>
                  <p className="text-2xl font-bold">{historyDetails.totalStudents}</p>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-gray-500">Successfully Generated</Label>
                  <p className="text-2xl font-bold text-green-600">{historyDetails.feesGenerated}</p>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-gray-500">Failed</Label>
                  <p className="text-2xl font-bold text-red-600">{historyDetails.feesFailed}</p>
                </div>
              </div>

              {/* Fee Structures Used */}
              {historyDetails.feeStructures && historyDetails.feeStructures.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Fee Structures Used</Label>
                  <div className="space-y-2">
                    {historyDetails.feeStructures.map((fs) => (
                      <div key={fs.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{fs.name}</span>
                          <span className="text-gray-600">₹{fs.amount.toLocaleString()}</span>
                        </div>
                        {fs.category && (
                          <p className="text-xs text-gray-500">Category: {fs.category.name}</p>
                        )}
                        {fs.class && (
                          <p className="text-xs text-gray-500">Class: {fs.class.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Students */}
              {historyDetails.failedStudentDetails && historyDetails.failedStudentDetails.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-red-600">
                    Failed Students ({historyDetails.failedStudentDetails.length})
                  </Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {historyDetails.failedStudentDetails.map((failed, idx) => (
                      <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex justify-between">
                          <span className="font-medium">{failed.studentName}</span>
                          <span className="text-xs text-gray-500">ID: {failed.studentId}</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{failed.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {historyDetails.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-semibold text-red-600 mb-2 block">Error Message</Label>
                  <p className="text-sm text-red-700">{historyDetails.errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 p-8">No details available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
