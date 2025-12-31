import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { studentsService } from '../services/students.service';
import { Student } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBook, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    class: '',
    section: '',
    status: 'active',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await studentsService.getAll();
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      // Check if user has schoolId, if not try to get it from localStorage or user object
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // If user doesn't have schoolId and no school subdomain is set, show helpful error
      if (!user?.schoolId && !localStorage.getItem('school_subdomain')) {
        setError('School context required. Please ensure you have a school assigned or access via school subdomain.');
        return;
      }
      
      if (editingStudent) {
        await studentsService.update(editingStudent.id, formData);
      } else {
        await studentsService.create(formData);
      }
      
      // Clear error on success
      setError('');
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save student';
      setError(errorMessage);
      
      // If error mentions school context, provide helpful guidance
      if (errorMessage.includes('School context') || errorMessage.includes('school')) {
        console.error('School context error:', errorMessage);
        console.log('User object:', JSON.parse(localStorage.getItem('user') || '{}'));
        console.log('School subdomain:', localStorage.getItem('school_subdomain'));
      }
      
      // Don't close modal on error so user can fix and retry
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      class: '',
      section: '',
      status: 'active',
    });
  };

  const handleEdit = (student: Student) => {
    setError(''); // Clear error when editing
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      class: student.class,
      section: student.section,
      status: student.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(id);
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header - Using shadcn/ui Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Students
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage student information and records
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  resetForm();
                  setError(''); // Clear error when opening modal
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add Student
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert - Only show if modal is not open (for load/delete errors) - Using shadcn/ui Card */}
        {error && !showModal && (
          <Card className="border-destructive border-l-4 animate-pulse-slow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                  <p className="text-sm text-destructive/90">{error}</p>
                  {error.includes('School context') && (
                    <div className="mt-3 text-xs text-destructive/80">
                      <p className="font-semibold mb-1">To fix this:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Ensure your user account has a school assigned</li>
                        <li>Or access the application via school subdomain (e.g., school1.localhost:5173)</li>
                        <li>If you're a super admin, create a school first and assign it to your account</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State - Using shadcn/ui Card */}
        {loading ? (
          <Card className="p-12">
            <CardContent className="flex items-center justify-center">
              <FiLoader className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Loading students...</span>
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
                  resetForm();
                  setError(''); // Clear error when opening modal
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/80 transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                              <FiUser className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMail className="w-4 h-4 mr-2 text-indigo-500" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="text-sm text-gray-500 mt-1">{student.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiBook className="w-4 h-4 mr-2 text-indigo-500" />
                          {student.class}
                          {student.section && <span className="ml-1">- {student.section}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            student.status === 'active'
                              ? 'default'
                              : student.status === 'graduated'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={
                            student.status === 'active'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                              : student.status === 'graduated'
                              ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0'
                              : ''
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingStudent(null);
            resetForm();
            setError(''); // Clear error when closing modal
          }}
          title={editingStudent ? 'Edit Student' : 'Add New Student'}
        >
          {/* Show error inside modal if present */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                  {error.includes('School context') && (
                    <div className="mt-2 text-xs text-red-500">
                      <p className="font-semibold mb-1">To fix this:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Ensure your user account has a school assigned</li>
                        <li>Or access the application via school subdomain</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="STU001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
                <Input
                  type="text"
                  required
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="10th Grade"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                <Input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingStudent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                {editingStudent ? 'Update Student' : 'Create Student'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
