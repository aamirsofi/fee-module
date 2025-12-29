import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiMapPin,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiChevronRight,
  FiSettings,
  FiBarChart2,
  FiFileText,
  FiMenu,
  FiX,
  FiMail,
} from "react-icons/fi";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Start collapsed for regular users, open for super admin
  const [sidebarOpen, setSidebarOpen] = useState(user?.role === "super_admin");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    schools: true,
    users: true,
    settings: false,
    analytics: false,
    reports: false,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Super Admin Sidebar Navigation Structure (define before use)
  const superAdminSections = [
    {
      name: "Dashboard",
      path: "/super-admin/dashboard",
      icon: FiHome,
      section: null,
      children: null,
    },
    {
      name: "Schools",
      icon: FiMapPin,
      section: "schools",
      children: [
        { name: "All Schools", path: "/super-admin/schools", icon: FiMapPin },
      ],
    },
    {
      name: "Users",
      icon: FiUser,
      section: "users",
      children: [
        { name: "All Users", path: "/super-admin/users", icon: FiUser },
      ],
    },
    {
      name: "Analytics",
      icon: FiBarChart2,
      section: "analytics",
      children: [
        { name: "Overview", path: "/super-admin/analytics", icon: FiBarChart2 },
        {
          name: "Revenue",
          path: "/super-admin/analytics/revenue",
          icon: FiDollarSign,
        },
        {
          name: "School Performance",
          path: "/super-admin/analytics/schools",
          icon: FiMapPin,
        },
      ],
    },
    {
      name: "Reports",
      icon: FiFileText,
      section: "reports",
      children: [
        {
          name: "Financial Reports",
          path: "/super-admin/reports/financial",
          icon: FiFileText,
        },
        {
          name: "School Reports",
          path: "/super-admin/reports/schools",
          icon: FiMapPin,
        },
        {
          name: "User Reports",
          path: "/super-admin/reports/users",
          icon: FiUser,
        },
      ],
    },
    {
      name: "Settings",
      icon: FiSettings,
      section: "settings",
      children: [
        {
          name: "System Settings",
          path: "/super-admin/settings/system",
          icon: FiSettings,
        },
        {
          name: "User Management",
          path: "/super-admin/settings/users",
          icon: FiUser,
        },
        {
          name: "Notifications",
          path: "/super-admin/settings/notifications",
          icon: FiMail,
        },
      ],
    },
  ];

  // Check if user is super admin (define after superAdminSections)
  const isSuperAdmin = user?.role === "super_admin";

  // Update sidebar state when user changes
  useEffect(() => {
    setSidebarOpen(isSuperAdmin);
  }, [isSuperAdmin]);

  // Auto-expand only the active section, collapse all others
  useEffect(() => {
    if (isSuperAdmin) {
      const newExpandedSections: Record<string, boolean> = {};
      
      superAdminSections.forEach((section) => {
        if (section.section && section.children) {
          const hasActive = section.children.some((child) =>
            isActive(child.path)
          );
          // Only expand the section that has an active child, collapse all others
          newExpandedSections[section.section] = hasActive;
        }
      });
      
      // Update all sections at once - collapse inactive ones, expand active one
      setExpandedSections((prev) => ({
        ...prev,
        ...newExpandedSections,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isSuperAdmin]);

  // Regular Admin Navigation
  const regularNavigation = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: FiHome,
      roles: ["administrator", "accountant"],
    },
    {
      name: "Students",
      path: "/students",
      icon: FiUsers,
      roles: ["administrator"],
    },
    {
      name: "Fee Structures",
      path: "/fee-structures",
      icon: FiDollarSign,
      roles: ["administrator"],
    },
    {
      name: "Payments",
      path: "/payments",
      icon: FiCreditCard,
      roles: ["administrator", "accountant"],
    },
  ];

  const filteredNavigation = regularNavigation.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  // Super Admin Layout with Sidebar
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - More compact */}
        <aside
          className={`${
            sidebarOpen
              ? "w-56 translate-x-0"
              : "w-16 -translate-x-full lg:translate-x-0"
          } bg-white shadow-xl transition-all duration-300 flex flex-col fixed h-screen z-50 lg:relative`}
        >
          {/* Logo */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FiDollarSign className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Super Admin
                </h1>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg mx-auto">
                <FiDollarSign className="w-4 h-4 text-white" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-smooth ml-auto"
            >
              {sidebarOpen ? (
                <FiX className="w-4 h-4" />
              ) : (
                <FiMenu className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation - More compact */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {superAdminSections.map((section) => {
              const Icon = section.icon;
              const isExpanded =
                expandedSections[section.section || ""] ?? false;
              const hasActiveChild = section.children?.some((child) =>
                isActive(child.path)
              );
              const isDashboardActive = section.path && isActive(section.path);

              // Dashboard (no children)
              if (!section.children) {
                return (
                  <Link
                    key={section.path}
                    to={section.path!}
                    className={`${
                      isDashboardActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    } flex items-center px-3 py-2 rounded-lg transition-smooth text-sm relative`}
                  >
                    {isDashboardActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-white/80 rounded-r-full" />
                    )}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="ml-2.5 font-medium">{section.name}</span>
                    )}
                  </Link>
                );
              }

              // Sections with children
              return (
                <div key={section.section}>
                  <button
                    onClick={() =>
                      section.section && toggleSection(section.section)
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-smooth text-sm relative ${
                      hasActiveChild
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {hasActiveChild && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full" />
                    )}
                    <div className="flex items-center">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          hasActiveChild ? "text-indigo-600" : ""
                        }`}
                      />
                      {sidebarOpen && (
                        <span className="ml-2.5 font-semibold">
                          {section.name}
                        </span>
                      )}
                    </div>
                    {sidebarOpen && section.children && (
                      <div className={hasActiveChild ? "text-indigo-600" : ""}>
                        {isExpanded ? (
                          <FiChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <FiChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </button>

                  {isExpanded && sidebarOpen && section.children && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {section.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = isActive(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`${
                              isChildActive
                                ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold shadow-sm"
                                : "text-gray-600 hover:bg-gray-50"
                            } flex items-center px-3 py-1.5 rounded-md transition-smooth text-xs relative`}
                          >
                            {isChildActive && (
                              <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full" />
                            )}
                            <ChildIcon
                              className={`w-3.5 h-3.5 mr-2 ${
                                isChildActive ? "text-indigo-600" : ""
                              }`}
                            />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Info & Logout - More compact */}
          <div className="p-3 border-t border-gray-200">
            {sidebarOpen && (
              <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                    <FiUser className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">
                      {user?.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="mb-3 flex justify-center">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                  <FiUser className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg text-xs font-medium shadow-lg hover:shadow-xl transition-smooth"
            >
              <FiLogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 transition-all duration-300">
          {/* Mobile Menu Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg lg:hidden"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          <main className="p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  // Regular Admin Layout (Top Navigation)
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
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                          : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
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
                  <span className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user?.role?.replace("_", " ")}
                  </span>
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
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
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
