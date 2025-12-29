import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { studentsService } from '../services/students.service';
import { paymentsService } from '../services/payments.service';
import { feeStructuresService } from '../services/feeStructures.service';
import { schoolsService } from '../services/schools.service';
import {
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiMapPin,
  FiLoader,
  FiTrendingUp,
} from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    students: 0,
    payments: 0,
    feeStructures: 0,
    schools: 0,
  });
  const [loading, setLoading] = useState(true);

  // Refresh stats when user changes or when navigating to dashboard
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, location.pathname]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const promises: Promise<any>[] = [];

      if (user.role === 'super_admin' || user.role === 'administrator') {
        promises.push(studentsService.getAll());
        promises.push(feeStructuresService.getAll());
      }

      if (user.role === 'super_admin' || user.role === 'administrator' || user.role === 'accountant') {
        promises.push(paymentsService.getAll());
      }

      if (user.role === 'super_admin') {
        promises.push(schoolsService.getAll());
      }

      const results = await Promise.all(promises);

      let index = 0;
      const newStats = { students: 0, payments: 0, feeStructures: 0, schools: 0 };
      
      if (user.role === 'super_admin' || user.role === 'administrator') {
        newStats.students = results[index++]?.length || 0;
        newStats.feeStructures = results[index++]?.length || 0;
      }

      if (user.role === 'super_admin' || user.role === 'administrator' || user.role === 'accountant') {
        newStats.payments = results[index++]?.length || 0;
      }

      if (user.role === 'super_admin') {
        newStats.schools = results[index++]?.length || 0;
      }

      setStats(newStats);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      console.error('Error details:', err.response?.data || err.message);
      // Set stats to 0 on error to show something
      setStats({ students: 0, payments: 0, feeStructures: 0, schools: 0 });
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
    value: number;
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
                value.toLocaleString()
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

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'super_admin':
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Schools"
              value={stats.schools}
              icon={FiMapPin}
              color="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
              link="/schools"
            />
            <StatCard
              title="Students"
              value={stats.students}
              icon={FiUsers}
              color="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
              link="/students"
            />
            <StatCard
              title="Fee Structures"
              value={stats.feeStructures}
              icon={FiDollarSign}
              color="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
              link="/fee-structures"
            />
            <StatCard
              title="Payments"
              value={stats.payments}
              icon={FiCreditCard}
              color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              link="/payments"
            />
          </div>
        );
      case 'administrator':
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard
              title="Students"
              value={stats.students}
              icon={FiUsers}
              color="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
              link="/students"
            />
            <StatCard
              title="Fee Structures"
              value={stats.feeStructures}
              icon={FiDollarSign}
              color="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
              link="/fee-structures"
            />
            <StatCard
              title="Payments"
              value={stats.payments}
              icon={FiCreditCard}
              color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              link="/payments"
            />
          </div>
        );
      case 'accountant':
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 max-w-md">
            <StatCard
              title="Payments"
              value={stats.payments}
              icon={FiCreditCard}
              color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              link="/payments"
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-12 card-modern rounded-2xl shadow-lg">
            <p className="text-gray-600">Welcome to School ERP Platform</p>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card-modern rounded-2xl shadow-xl p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-indigo-100 capitalize">
            {user?.role?.replace('_', ' ')} Dashboard
          </p>
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
          {getRoleSpecificContent()}
        </div>
      </div>
    </Layout>
  );
}
