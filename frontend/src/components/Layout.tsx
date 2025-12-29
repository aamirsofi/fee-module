import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiDollarSign, 
  FiCreditCard, 
  FiMapPin,
  FiLogOut,
  FiUser
} from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    // Super Admin Navigation
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: FiHome, roles: ['super_admin'] },
    { name: 'Schools', path: '/super-admin/schools', icon: FiMapPin, roles: ['super_admin'] },
    { name: 'Users', path: '/super-admin/users', icon: FiUser, roles: ['super_admin'] },
    // School Admin Navigation
    { name: 'Dashboard', path: '/dashboard', icon: FiHome, roles: ['administrator', 'accountant'] },
    { name: 'Students', path: '/students', icon: FiUsers, roles: ['administrator'] },
    { name: 'Fee Structures', path: '/fee-structures', icon: FiDollarSign, roles: ['administrator'] },
    { name: 'Payments', path: '/payments', icon: FiCreditCard, roles: ['administrator', 'accountant'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    user?.role && item.roles.includes(user.role),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="card-modern shadow-lg border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg hover-lift">
                    <FiDollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    School ERP Platform
                  </h1>
                </div>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                          : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                      } inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-smooth hover-lift`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 card-modern rounded-xl hover-lift">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-smooth hover-lift"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden border-t border-white/20">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                  } flex items-center pl-3 pr-4 py-3 rounded-xl text-base font-medium transition-smooth`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">{children}</div>
      </main>
    </div>
  );
}

