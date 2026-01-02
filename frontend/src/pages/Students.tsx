import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { studentsService } from '../services/students.service';
import { academicYearsService } from '../services/academicYears.service';
import { studentAcademicRecordsService } from '../services/studentAcademicRecords.service';
import { schoolService, School } from '../services/schoolService';
import { useAuth } from '../contexts/AuthContext';
import { Student, AcademicYear, StudentAcademicRecord } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBook, FiLoader, FiCalendar } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DataTable } from '@/components/DataTable';
import api from '../services/api';

interface Class {
  id: number;
  name: string;
}

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAcademicRecordModal, setShowAcademicRecordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>('');
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicRecords, setAcademicRecords] = useState<Record<number, StudentAcademicRecord>>({});


  // Save school selection to localStorage whenever it changes (for super admin)
  useEffect(() => {
    if (user?.role === 'super_admin' && selectedSchoolId && selectedSchoolId !== '' && selectedSchoolId !== 'all') {
      localStorage.setItem('students_selected_school_id', selectedSchoolId.toString());
    }
  }, [selectedSchoolId, user]);

  // Load schools for super admin
  const { data: schoolsData, isLoading: loadingSchools } = useInfiniteQuery({
    queryKey: ['schools', 'active'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolService.getSchools({
        page: pageParam,
        limit: 100,
        status: 'active',
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.hasNextPage) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: user?.role === 'super_admin',
  });

  const schools: School[] =
    schoolsData?.pages.flatMap((page) => page.data || []) || [];
  
  const [academicRecordData, setAcademicRecordData] = useState({
    classId: '',
    section: '',
    rollNumber: '',
  });

  // Load saved school selection from localStorage for super admin, or select first school
  useEffect(() => {
    if (user?.role === 'super_admin' && schools.length > 0) {
      const savedSchoolId = localStorage.getItem('students_selected_school_id');
      if (savedSchoolId && schools.some(s => s.id.toString() === savedSchoolId)) {
        // Use saved school if it still exists
        setSelectedSchoolId(savedSchoolId);
      } else if (!selectedSchoolId || selectedSchoolId === '') {
        // Auto-select first school if nothing is saved or selected
        const firstSchoolId = schools[0].id.toString();
        setSelectedSchoolId(firstSchoolId);
        localStorage.setItem('students_selected_school_id', firstSchoolId);
      }
    }
  }, [user, schools, selectedSchoolId]);

  // Check for success message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    if (successMessage) {
      setSuccess(decodeURIComponent(successMessage));
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
        // Remove success param from URL without reload
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]success=[^&]*/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      }, 5000);
    }
  }, []);

  // Set default school for non-super-admin users
  useEffect(() => {
    if (user?.role !== 'super_admin' && user?.schoolId) {
      setSelectedSchoolId(user.schoolId);
      setLoading(false); // Don't show loading if we're setting default
    } else if (user?.role === 'super_admin') {
      // For super admin, don't load until school is selected
      setLoading(false);
      setStudents([]);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      // Only load if a school is selected (not empty)
      if (
        selectedSchoolId &&
        selectedSchoolId !== '' &&
        selectedSchoolId !== 'all'
      ) {
        loadData();
      } else {
        // No school selected, show empty state
        setStudents([]);
        setLoading(false);
        setError('');
      }
    } else if (user?.schoolId) {
      // For school admin, load immediately
      loadData();
    }
  }, [selectedSchoolId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const schoolId =
        user?.role === 'super_admin'
          ? selectedSchoolId && selectedSchoolId !== 'all'
            ? +selectedSchoolId
            : undefined
          : user?.schoolId;

      if (!schoolId && user?.role === 'super_admin') {
        setError('Please select a school to view students');
        setLoading(false);
        return;
      }

      // Load current academic year
      const year = await academicYearsService.getCurrent(schoolId);
      setCurrentAcademicYear(year);
      
      // Load students
      const studentsData = await studentsService.getAll(schoolId);
      setStudents(studentsData);
      
      // Load classes
      try {
        const classesParams: any = { page: 1, limit: 100 };
        if (schoolId) {
          classesParams.schoolId = schoolId;
        }
        const classesResponse = await api.instance.get('/classes', {
          params: classesParams,
        });
        
        // Extract data array from paginated response
        // axios response.data contains the JSON body, which has { data: [...], meta: {...} }
        let classesData: Class[] = [];
        if (classesResponse.data) {
          if (Array.isArray(classesResponse.data)) {
            // Direct array response
            classesData = classesResponse.data;
          } else if (classesResponse.data.data && Array.isArray(classesResponse.data.data)) {
            // Paginated response { data: [...], meta: {...} }
            classesData = classesResponse.data.data;
          }
        }
        setClasses(classesData);
      } catch (err: any) {
        // Failed to load classes - set empty array
        setClasses([]); // Set empty array on error
      }
      
      // Load current academic records for all students
      const recordsMap: Record<number, StudentAcademicRecord> = {};
      for (const student of studentsData) {
        try {
          const record = await studentAcademicRecordsService.getCurrent(student.id);
          if (record) {
            recordsMap[student.id] = record;
          }
        } catch (err) {
          // No record found, skip
        }
      }
      setAcademicRecords(recordsMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const handleAcademicRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentAcademicYear) return;
    
    try {
      setError('');
      await studentAcademicRecordsService.create({
        studentId: selectedStudent.id,
        academicYearId: currentAcademicYear.id,
        classId: parseInt(academicRecordData.classId),
        section: academicRecordData.section || undefined,
        rollNumber: academicRecordData.rollNumber || undefined,
        status: 'active',
      });
      
      setShowAcademicRecordModal(false);
      setSelectedStudent(null);
      setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
      loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create academic record';
      setError(errorMessage);
    }
  };


  const handleEdit = useCallback((student: Student) => {
    // Include schoolId in URL for super admin when editing
    if (user?.role === 'super_admin' && selectedSchoolId && selectedSchoolId !== 'all') {
      navigate(`/students/${student.id}/edit?schoolId=${selectedSchoolId}`);
    } else {
      navigate(`/students/${student.id}/edit`);
    }
  }, [user, selectedSchoolId, navigate]);

  const handleAddAcademicRecord = useCallback((student: Student) => {
    setSelectedStudent(student);
    setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
    setError('');
    setShowAcademicRecordModal(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  }, [loadData]);

  const getCurrentClass = (student: Student): string => {
    const record = academicRecords[student.id];
    if (record?.class) {
      return `${record.class.name}${record.section ? ` - ${record.section}` : ''}`;
    }
    return 'Not assigned';
  };

  // Define columns for the data table
  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Student
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <FiUser className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-900">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-sm text-gray-500">ID: {student.studentId}</div>
            </div>
          </div>
        );
      },
      accessorFn: (row) => `${row.firstName} ${row.lastName} ${row.studentId}`,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Contact
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div>
            <div className="flex items-center text-sm text-gray-900">
              <FiMail className="w-4 h-4 mr-2 text-indigo-500" />
              {student.email}
            </div>
            {student.phone && (
              <div className="text-sm text-gray-500 mt-1">{student.phone}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'class',
      header: `Class (${currentAcademicYear?.name || 'N/A'})`,
      cell: ({ row }) => {
        const student = row.original;
        const record = academicRecords[student.id];
        return (
          <div>
            <div className="flex items-center text-sm text-gray-900">
              <FiBook className="w-4 h-4 mr-2 text-indigo-500" />
              {getCurrentClass(student)}
            </div>
            {!record && (
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1 p-0 h-auto"
                onClick={() => handleAddAcademicRecord(student)}
              >
                Assign class
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={
              status === 'active'
                ? 'default'
                : status === 'graduated'
                ? 'secondary'
                : 'outline'
            }
            className={
              status === 'active'
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                : status === 'graduated'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0'
                : ''
            }
          >
            {status}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const rowValue = row.getValue(id);
        if (typeof value === 'function') {
          return value(rowValue);
        }
        if (Array.isArray(value)) {
          return value.includes(rowValue);
        }
        return rowValue === value;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            <Button
              onClick={() => handleEdit(student)}
              variant="ghost"
              size="icon"
              className="text-primary hover:text-primary hover:bg-primary/10"
              title="Edit"
            >
              <FiEdit2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => handleDelete(student.id)}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <FiTrash2 className="w-5 h-5" />
            </Button>
          </div>
        );
      },
    },
  ], [academicRecords, currentAcademicYear, handleEdit, handleDelete, handleAddAcademicRecord, getCurrentClass]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="/">Home</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Students</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Students
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage student information and academic records
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {user?.role === 'super_admin' && (
                  <Select
                    value={selectedSchoolId ? selectedSchoolId.toString() : ''}
                    onValueChange={(value) => setSelectedSchoolId(value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select School" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  onClick={() => {
                    if (user?.role === 'super_admin') {
                      if (!selectedSchoolId || selectedSchoolId === 'all' || selectedSchoolId === '') {
                        alert('Please select a school first before adding a student.');
                        return;
                      }
                      const url = `/students/new?schoolId=${selectedSchoolId}`;
                      navigate(url);
                    } else {
                      navigate('/students/new');
                    }
                  }}
                  disabled={
                    user?.role === 'super_admin' &&
                    (!selectedSchoolId || selectedSchoolId === 'all' || selectedSchoolId === '')
                  }
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Success Alert */}
        {success && (
          <Card className="border-l-4 border-l-green-400 bg-green-50 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && !showAcademicRecordModal && (
          <Card className="border-destructive border-l-4 animate-pulse-slow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card className="p-12">
            <CardContent className="flex items-center justify-center">
              <FiLoader className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Loading students...</span>
            </CardContent>
          </Card>
        ) : user?.role === 'super_admin' && (!selectedSchoolId || selectedSchoolId === 'all') ? (
          <Card className="text-center py-12 animate-fade-in">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                <FiUser className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="mb-2">Select a School</CardTitle>
              <CardDescription className="mb-4">
                Please select a school from the dropdown above to view students.
              </CardDescription>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card className="text-center py-12 animate-fade-in">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full mb-4 shadow-lg">
                <FiUser className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="mb-2">No students found</CardTitle>
              <CardDescription className="mb-4">Get started by creating a new student.</CardDescription>
              <Button
                onClick={() => {
                  if (user?.role === 'super_admin') {
                    if (!selectedSchoolId || selectedSchoolId === 'all' || selectedSchoolId === '') {
                      alert('Please select a school first before adding a student.');
                      return;
                    }
                    navigate(`/students/new?schoolId=${selectedSchoolId}`);
                  } else {
                    navigate('/students/new');
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <DataTable
                columns={columns}
                data={students}
                searchKey="name"
                searchPlaceholder="Search students by name or ID..."
              />
            </CardContent>
          </Card>
        )}


        {/* Academic Record Modal */}
        <Modal
          isOpen={showAcademicRecordModal}
          onClose={() => {
            setShowAcademicRecordModal(false);
            setSelectedStudent(null);
            setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
            setError('');
          }}
          title={`Assign Class - ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleAcademicRecordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year
              </label>
              <Input
                type="text"
                value={currentAcademicYear?.name || 'N/A'}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class *
              </label>
              <Select
                key={`class-select-${classes.length}`}
                value={academicRecordData.classId}
                onValueChange={(value) => setAcademicRecordData({ ...academicRecordData, classId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    return Array.isArray(classes) && classes.length > 0 ? (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {classes?.length === 0 ? 'No classes available' : 'Loading classes...'}
                      </div>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <Input
                  type="text"
                  value={academicRecordData.section}
                  onChange={(e) => setAcademicRecordData({ ...academicRecordData, section: e.target.value })}
                  placeholder="A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roll Number
                </label>
                <Input
                  type="text"
                  value={academicRecordData.rollNumber}
                  onChange={(e) => setAcademicRecordData({ ...academicRecordData, rollNumber: e.target.value })}
                  placeholder="001"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAcademicRecordModal(false);
                  setSelectedStudent(null);
                  setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                Assign Class
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
