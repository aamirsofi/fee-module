import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MultiStepStudentForm from '../components/MultiStepStudentForm';
import { studentsService } from '../services/students.service';
import { Student } from '../types';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function AddEditStudent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get schoolId from URL query params (for super admin) or from user context
  const schoolIdFromUrl = searchParams.get('schoolId');
  
  // Check if super admin is trying to add student without selecting school
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (user?.role === 'super_admin' && !id && !schoolIdFromUrl) {
      // Redirect back to students list with message
      alert('Please select a school from the dropdown before adding a student.');
      navigate('/super-admin/students', { replace: true });
    }
  }, [id, schoolIdFromUrl, navigate]);

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const student = await studentsService.getById(parseInt(id!));
      setEditingStudent(student);
    } catch (err) {
      navigate('/super-admin/students');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    const successMessage = id 
      ? 'Student updated successfully!' 
      : 'Student created successfully!';
    navigate(`/super-admin/students?success=${encodeURIComponent(successMessage)}`);
  };

  const handleClose = () => {
    navigate('/students');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/super-admin/students">Students</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{id ? 'Edit Student' : 'Add Student'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <MultiStepStudentForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          editingStudent={editingStudent}
        />
      </div>
    </Layout>
  );
}

