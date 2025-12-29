import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { feeStructuresService } from '../services/feeStructures.service';
import { feeCategoriesService } from '../services/feeCategories.service';
import { FeeStructure, FeeCategory } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiLoader } from 'react-icons/fi';

export default function FeeStructures() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<Partial<FeeStructure>>({
    name: '',
    description: '',
    amount: 0,
    categoryId: 0,
    academicYear: '',
    dueDate: '',
    applicableClasses: [],
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [structures, cats] = await Promise.all([
        feeStructuresService.getAll(),
        feeCategoriesService.getAll(),
      ]);
      setFeeStructures(structures);
      setCategories(cats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStructure) {
        await feeStructuresService.update(editingStructure.id, formData);
      } else {
        await feeStructuresService.create(formData);
      }
      setShowModal(false);
      setEditingStructure(null);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fee structure');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      categoryId: 0,
      academicYear: '',
      dueDate: '',
      applicableClasses: [],
      status: 'active',
    });
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      description: structure.description,
      amount: structure.amount,
      categoryId: structure.categoryId,
      academicYear: structure.academicYear,
      dueDate: structure.dueDate,
      applicableClasses: structure.applicableClasses,
      status: structure.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await feeStructuresService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fee structure');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card-modern rounded-2xl shadow-lg p-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Fee Structures
              </h1>
              <p className="mt-1 text-sm text-gray-600">Manage fee structures and pricing</p>
            </div>
            <button
              onClick={() => {
                setEditingStructure(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-smooth hover-lift font-medium"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              Add Fee Structure
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card-modern rounded-xl border-l-4 border-red-400 p-4 animate-pulse-slow">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card-modern rounded-2xl shadow-lg p-12 flex items-center justify-center">
            <FiLoader className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="ml-3 text-gray-600">Loading fee structures...</span>
          </div>
        ) : feeStructures.length === 0 ? (
          <div className="text-center py-12 card-modern rounded-2xl shadow-lg animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 rounded-full mb-4 shadow-lg">
              <FiDollarSign className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fee structures found</h3>
            <p className="text-gray-500 mb-4">Get started by creating a new fee structure.</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-smooth hover-lift font-medium"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </button>
          </div>
        ) : (
          <div className="card-modern rounded-2xl shadow-lg overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fee Structure
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Academic Year
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
                  {feeStructures.map((structure) => (
                    <tr key={structure.id} className="hover:bg-white/80 transition-smooth">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{structure.name}</div>
                          {structure.description && (
                            <div className="text-sm text-gray-500 mt-1">{structure.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-semibold text-gray-900">
                          <FiDollarSign className="w-4 h-4 mr-1 text-indigo-500" />
                          ${structure.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {structure.academicYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                            structure.status === 'active'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}
                        >
                          {structure.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(structure)}
                            className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-xl transition-smooth hover-lift shadow-sm hover:shadow-md"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(structure.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-xl transition-smooth hover-lift shadow-sm hover:shadow-md"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingStructure(null);
            resetForm();
          }}
          title={editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                placeholder="Tuition Fee"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm resize-none"
                placeholder="Fee description..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
              >
                <option value={0}>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                placeholder="2024-2025"
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
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-smooth hover-lift shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-smooth hover-lift"
              >
                {editingStructure ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

