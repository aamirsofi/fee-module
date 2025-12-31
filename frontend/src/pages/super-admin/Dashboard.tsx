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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
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
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white">
            Welcome back, {user?.name}! 👋
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Super Admin Dashboard
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <Button
            onClick={loadStats}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 mr-1 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Recent Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

