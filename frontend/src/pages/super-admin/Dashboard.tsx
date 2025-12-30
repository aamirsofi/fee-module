import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiDollarSign,
  FiUsers,
  FiMapPin,
  FiCreditCard,
  FiTrendingUp,
  FiLoader,
} from 'react-icons/fi';
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

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    link,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    link: string;
  }) => {
    const content = (
      <div className="card-modern rounded-2xl shadow-lg hover:shadow-xl transition-smooth hover-lift p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              {loading ? (
                <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                typeof value === 'number' ? value.toLocaleString() : value
              )}
            </p>
          </div>
          <div className={`${color} p-4 rounded-xl shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <FiTrendingUp className="w-4 h-4 mr-1" />
          <span>View all</span>
        </div>
      </div>
    );

    return link ? (
      <Link to={link} className="block">
        {content}
      </Link>
    ) : (
      content
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card-modern rounded-2xl shadow-xl p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-indigo-100">Super Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <button
            onClick={loadStats}
            disabled={loading}
            className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 flex items-center shadow-md hover:shadow-lg transition-smooth hover-lift"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 mr-1 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Schools"
            value={stats?.totalSchools || 0}
            icon={FiMapPin}
            color="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
            link="/super-admin/schools"
          />
          <StatCard
            title="Users"
            value={stats?.totalUsers || 0}
            icon={FiUsers}
            color="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
            link="/super-admin/users"
          />
          <StatCard
            title="Students"
            value={stats?.totalStudents || 0}
            icon={FiUsers}
            color="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
            link="#"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={FiDollarSign}
            color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
            link="#"
          />
        </div>
      </div>

      {/* Recent Schools */}
      {stats?.recentSchools && stats.recentSchools.length > 0 && (
        <div className="card-modern rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Schools</h2>
          <div className="space-y-3">
            {stats.recentSchools.map((school) => (
              <Link
                key={school.id}
                to={`/super-admin/schools/${school.id}/details`}
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-200 hover:bg-indigo-50/50 hover:border-indigo-200 transition-smooth"
              >
                <div>
                  <p className="font-semibold text-gray-800">{school.name}</p>
                  <p className="text-sm text-gray-600">{school.subdomain}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(school.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

