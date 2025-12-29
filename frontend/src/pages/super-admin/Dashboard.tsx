import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiDollarSign, FiUsers, FiBook, FiTrendingUp, FiSchool, FiLoader } from 'react-icons/fi';
import api from '../../services/api';

interface DashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalPayments: number;
  totalRevenue: number;
  recentSchools: any[];
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.instance.get('/super-admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern rounded-2xl p-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Schools</p>
              <p className="text-3xl font-bold text-indigo-600">{stats?.totalSchools || 0}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiSchool className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-pink-600">{stats?.totalStudents || 0}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <FiBook className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="card-modern rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Schools</h2>
          <button
            onClick={loadStats}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Refresh
          </button>
        </div>
        {stats?.recentSchools && stats.recentSchools.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSchools.map((school) => (
              <div
                key={school.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-200"
              >
                <div>
                  <p className="font-semibold text-gray-800">{school.name}</p>
                  <p className="text-sm text-gray-600">{school.subdomain}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(school.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No schools yet</p>
        )}
      </div>
    </div>
  );
}

