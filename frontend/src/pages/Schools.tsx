import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { schoolsService } from '../services/schools.service';
import { School } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiMail, FiPhone, FiLoader, FiGlobe } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Schools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await schoolsService.getAll();
      setSchools(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (editingSchool) {
        await schoolsService.update(editingSchool.id, formData);
      } else {
        await schoolsService.create(formData);
      }
      setShowModal(false);
      setEditingSchool(null);
      resetForm();
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save school');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    });
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      subdomain: school.subdomain,
      email: school.email,
      phone: school.phone,
      address: school.address,
      status: school.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) return;
    try {
      await schoolsService.delete(id);
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete school');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Schools
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage school information and settings
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingSchool(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add School
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="border-l-4 border-l-red-400 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="pt-12 pb-12 flex items-center justify-center">
              <FiLoader className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="ml-3 text-gray-600">Loading schools...</span>
            </CardContent>
          </Card>
        ) : schools.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                <FiMapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
              <p className="text-gray-500 mb-4">Get started by creating a new school.</p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add School
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subdomain
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
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
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-white/80 transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                              <FiMapPin className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{school.name}</div>
                            {school.address && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{school.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiGlobe className="w-4 h-4 mr-2 text-indigo-500" />
                          <span className="font-mono bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-lg text-indigo-700 font-semibold">{school.subdomain}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {school.email && (
                            <div className="flex items-center mb-1">
                              <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                              {school.email}
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center">
                              <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                              {school.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            school.status === 'active'
                              ? 'default'
                              : school.status === 'suspended'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            school.status === 'active'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                              : school.status === 'suspended'
                              ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white border-0'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0'
                          }
                        >
                          {school.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(school)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(school.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
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
            setEditingSchool(null);
            resetForm();
          }}
          title={editingSchool ? 'Edit School' : 'Add New School'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">School Name *</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ABC School"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subdomain *</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">https://</span>
                <Input
                  type="text"
                  required
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="school1"
                />
                <span className="text-gray-500 text-sm font-medium">.yourdomain.com</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Used for multi-tenant access</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@school.com"
                />
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm resize-none"
                placeholder="123 Main Street, City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingSchool(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                {editingSchool ? 'Update School' : 'Create School'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
