import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSchool } from "../contexts/SchoolContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FiBell,
  FiChevronUp,
  FiUpload,
  FiTag,
  FiBook,
  FiCalendar,
} from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const {
    selectedSchool,
    loadingSchools,
    schools,
    selectedSchoolId,
    setSelectedSchoolId,
  } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();
  // Start collapsed for regular users, open for super admin
  const [sidebarOpen, setSidebarOpen] = useState(user?.role === "super_admin");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    schools: true,
    students: true,
    settings: false,
    "fee-settings": false,
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
      name: "Students",
      icon: FiUsers,
      section: "students",
      children: [
        { name: "All Students", path: "/super-admin/students", icon: FiUsers },
        {
          name: "Bulk Import Students",
          path: "/super-admin/students/bulk-import",
          icon: FiUpload,
        },
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
          name: "Fee Settings",
          icon: FiDollarSign,
          section: "fee-settings",
          children: [
            {
              name: "Category Heads",
              path: "/super-admin/settings/fee-settings/category-heads",
              icon: FiTag,
            },
            {
              name: "Fee Headings",
              path: "/super-admin/settings/fee-settings/fee-heading",
              icon: FiDollarSign,
            },
            {
              name: "Fee Plans",
              path: "/super-admin/settings/fee-settings/fee-plan",
              icon: FiCreditCard,
            },
            {
              name: "Route Plans",
              path: "/super-admin/settings/fee-settings/route-plan",
              icon: FiMapPin,
            },
          ],
        },
        {
          name: "Academics",
          icon: FiBook,
          section: "academics",
          children: [
            {
              name: "Classes",
              path: "/super-admin/settings/academics/class",
              icon: FiBook,
            },
            {
              name: "Academic Years",
              path: "/super-admin/settings/academics/academic-years",
              icon: FiCalendar,
            },
          ],
        },
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
          name: "Announcements",
          path: "/super-admin/settings/announcements",
          icon: FiBell,
        },
      ],
    },
    {
      name: "Profile",
      path: "/super-admin/profile",
      icon: FiUser,
    },
  ];

  // Check if user is super admin (define after superAdminSections)
  const isSuperAdmin = user?.role === "super_admin";

  // Update sidebar state when user changes
  useEffect(() => {
    setSidebarOpen(isSuperAdmin);
  }, [isSuperAdmin]);

  // Helper function to recursively check if any child is active and collect nested sections
  const hasActiveChildRecursive = (
    children: Array<{
      path?: string;
      section?: string;
      children?: Array<{ path?: string; section?: string; children?: any[] }>;
    }>,
    nestedSections: Set<string> = new Set()
  ): { hasActive: boolean; nestedSections: Set<string> } => {
    let hasActive = false;

    for (const child of children) {
      if (child.path && isActive(child.path)) {
        hasActive = true;
      }
      // If this child has a section property, check if it has active children
      if (child.section) {
        nestedSections.add(child.section);
        // Recursively check nested children to see if this nested section should be expanded
        if (child.children) {
          const nestedResult = hasActiveChildRecursive(
            child.children,
            nestedSections
          );
          // If nested children are active, mark this nested section for expansion
          if (nestedResult.hasActive) {
            hasActive = true;
          }
        }
      } else if (child.children) {
        const result = hasActiveChildRecursive(child.children, nestedSections);
        hasActive = hasActive || result.hasActive;
      }
    }

    return { hasActive, nestedSections };
  };

  // Auto-expand only the active section, collapse all others
  useEffect(() => {
    if (isSuperAdmin) {
      const newExpandedSections: Record<string, boolean> = {};
      const nestedSectionsToExpand = new Set<string>();

      superAdminSections.forEach((section) => {
        if (section.section && section.children) {
          // Recursively check if any child (at any level) is active
          const { hasActive, nestedSections } = hasActiveChildRecursive(
            section.children
          );
          // Only expand the section that has an active child, collapse all others
          newExpandedSections[section.section] = hasActive;

          // If this section has active children, also expand its nested sections
          if (hasActive) {
            nestedSections.forEach((nestedSection) => {
              nestedSectionsToExpand.add(nestedSection);
            });
          }
        }
      });

      // Expand nested sections that have active children
      nestedSectionsToExpand.forEach((nestedSection) => {
        newExpandedSections[nestedSection] = true;
      });

      // Update all sections at once - collapse inactive ones, expand active ones
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
      path: "/super-admin/dashboard",
      icon: FiHome,
      roles: ["administrator", "accountant"],
    },
    {
      name: "Students",
      path: "/super-admin/students",
      icon: FiUsers,
      roles: ["super_admin"],
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

  // Helper function to render navigation items recursively using shadcn Sidebar
  const renderNavItem = (
    item: {
      name: string;
      path?: string;
      icon?: any;
      section?: string;
      children?: any[];
    },
    level: number = 0
  ) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = item.section
      ? expandedSections[item.section] ?? false
      : false;
    const isItemActive = item.path ? isActive(item.path) : false;
    const hasActiveChild =
      hasChildren &&
      item.children!.some((child) => {
        if (child.path) return isActive(child.path);
        if (child.children) {
          return child.children.some((gc: any) =>
            gc.path ? isActive(gc.path) : false
          );
        }
        return false;
      });

    if (!hasChildren && item.path) {
      // Simple menu item with path
      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton asChild isActive={isItemActive}>
            <Link to={item.path}>
              {Icon && <Icon className="w-4 h-4" />}
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    if (hasChildren && item.section) {
      // Collapsible section with children
      return (
        <Collapsible
          key={item.section}
          open={isExpanded}
          onOpenChange={() => toggleSection(item.section!)}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton isActive={hasActiveChild}>
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.name}</span>
                {isExpanded ? (
                  <FiChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <FiChevronRight className="w-4 h-4 ml-auto" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children!.map((child) => {
                  if (child.children && child.section) {
                    // Nested collapsible section
                    const ChildIcon = child.icon;
                    const isChildExpanded =
                      expandedSections[child.section] ?? false;
                    const hasActiveGrandchild = child.children.some((gc: any) =>
                      gc.path ? isActive(gc.path) : false
                    );
                    return (
                      <Collapsible
                        key={child.section}
                        open={isChildExpanded}
                        onOpenChange={() => toggleSection(child.section!)}
                      >
                        <SidebarMenuSubItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton
                              isActive={hasActiveGrandchild}
                            >
                              {ChildIcon && (
                                <ChildIcon className="w-3.5 h-3.5" />
                              )}
                              <span>{child.name}</span>
                              {isChildExpanded ? (
                                <FiChevronDown className="w-3 h-3 ml-auto" />
                              ) : (
                                <FiChevronRight className="w-3 h-3 ml-auto" />
                              )}
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {child.children.map((grandchild: any) => {
                                if (grandchild.children && grandchild.section) {
                                  // 4th level - render recursively
                                  return renderNavItem(grandchild, level + 1);
                                }
                                const GrandchildIcon = grandchild.icon;
                                const isGrandchildActive = grandchild.path
                                  ? isActive(grandchild.path)
                                  : false;
                                return (
                                  <SidebarMenuSubItem key={grandchild.path}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isGrandchildActive}
                                    >
                                      <Link to={grandchild.path}>
                                        {GrandchildIcon && (
                                          <GrandchildIcon className="w-3 h-3" />
                                        )}
                                        <span>{grandchild.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuSubItem>
                      </Collapsible>
                    );
                  }
                  // Regular child with path
                  const ChildIcon = child.icon;
                  const isChildActive = child.path
                    ? isActive(child.path)
                    : false;
                  return (
                    <SidebarMenuSubItem key={child.path}>
                      <SidebarMenuSubButton asChild isActive={isChildActive}>
                        <Link to={child.path!}>
                          {ChildIcon && <ChildIcon className="w-3.5 h-3.5" />}
                          <span>{child.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return null;
  };

  // Super Admin Layout with Sidebar
  if (isSuperAdmin) {
    return (
      <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <FiDollarSign className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-data-[collapsible=icon]:hidden">
                  Super Admin
                </h1>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {superAdminSections.map((section) => renderNavItem(section))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="px-2 py-2">
              <Card className="border-0 shadow-none bg-sidebar-accent">
                <CardContent className="p-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                      <FiUser className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-xs font-medium text-sidebar-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-sidebar-foreground/70 capitalize">
                        {user?.role?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 lg:px-6 py-2">
              <div className="flex items-center justify-between">
                <SidebarTrigger />
                <div className="flex-1" />
                {/* Right Side: Notifications & User Menu */}
                <div className="flex items-center gap-2">
                  {/* School Selector - Only for Super Admin */}
                  {user?.role === "super_admin" && (
                    <div className="flex items-center gap-2">
                      {loadingSchools ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-600">
                            Loading...
                          </span>
                        </div>
                      ) : schools.length > 0 ? (
                        <Select
                          value={
                            selectedSchoolId ? selectedSchoolId.toString() : ""
                          }
                          onValueChange={(value) => {
                            setSelectedSchoolId(
                              value === "" ? null : parseInt(value)
                            );
                          }}
                        >
                          <SelectTrigger className="w-[200px] h-9 bg-white/50 backdrop-blur-sm border-gray-200">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="w-4 h-4 text-indigo-600" />
                              <SelectValue placeholder="Select School">
                                {selectedSchool ? (
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {selectedSchool.name}
                                    </p>
                                    {selectedSchool.subdomain && (
                                      <p className="text-xs text-gray-500">
                                        {selectedSchool.subdomain}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  "Select School"
                                )}
                              </SelectValue>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {schools.map((school) => (
                              <SelectItem
                                key={school.id}
                                value={school.id.toString()}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {school.name}
                                  </span>
                                  {school.subdomain && (
                                    <span className="text-xs text-gray-500">
                                      {school.subdomain}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            No schools available
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Notifications */}
                  <NotificationBell />

                  {/* User Menu - Using shadcn/ui DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-lg transition-smooth">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                          <FiUser className="w-4 h-4 text-white" />
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {user?.role?.replace("_", " ")}
                          </p>
                        </div>
                        <FiChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div>
                          <p className="text-sm font-semibold">{user?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {user?.role?.replace("_", " ")}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to={
                            user?.role === "super_admin"
                              ? "/super-admin/profile"
                              : "/profile"
                          }
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <FiUser className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {user?.role === "super_admin" && (
                        <DropdownMenuItem asChild>
                          <Link
                            to="/super-admin/settings"
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <FiSettings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <FiLogOut className="w-4 h-4 mr-3" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
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
              <NotificationBell />
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
