import { ReactNode, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  FiBell,
  FiChevronUp,
  FiUpload,
  FiTag,
  FiBook,
} from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

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
    "fee-settings": false,
    analytics: false,
    reports: false,
  });
  // Note: showUserMenu and showNotifications removed - now using DropdownMenu components
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        {
          name: "Bulk Import Students",
          path: "/super-admin/schools/bulk-import",
          icon: FiUpload,
        },
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
              path: "/super-admin/settings/fee-settings/fee-heads/route-plan",
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
      <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex overflow-hidden">
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
          } bg-white shadow-xl transition-all duration-300 flex flex-col fixed h-screen z-50 lg:relative overflow-visible`}
        >
          {/* Logo */}
          {sidebarOpen && (
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                  <FiDollarSign className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Super Admin
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}
          {!sidebarOpen && (
            <div className="p-2 border-b border-gray-200 flex justify-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-smooth"
                title="Open menu"
              >
                <FiMenu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Navigation - More compact */}
          <nav className="flex-1 overflow-y-auto overflow-x-visible p-3 space-y-1">
            {superAdminSections.map((section) => {
              const Icon = section.icon;
              const isExpanded =
                expandedSections[section.section || ""] ?? false;
              const hasActiveChild = section.children?.some((child) => {
                if (child.path) {
                  return isActive(child.path);
                }
                // Check nested children
                if (child.children) {
                  return child.children.some((grandchild) => {
                    if (grandchild.path) {
                      return isActive(grandchild.path);
                    }
                    // Check 4th level
                    if (grandchild.children) {
                      return grandchild.children.some((ggc) =>
                        ggc.path ? isActive(ggc.path) : false
                      );
                    }
                    return false;
                  });
                }
                return false;
              });
              const isDashboardActive = section.path && isActive(section.path);

              // Dashboard (no children) - Using shadcn/ui Button
              if (!section.children) {
                return (
                  <Button
                    key={section.path}
                    asChild
                    variant={isDashboardActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isDashboardActive
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:from-indigo-700 hover:to-purple-700"
                        : "text-gray-700 hover:bg-gray-100"
                    } relative`}
                  >
                    <Link to={section.path!}>
                      {isDashboardActive && (
                        <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-white/80 rounded-r-full" />
                      )}
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="ml-2.5 font-medium">
                          {section.name}
                        </span>
                      )}
                    </Link>
                  </Button>
                );
              }

              // Sections with children
              return (
                <div
                  key={section.section}
                  ref={(el) => {
                    if (section.section) {
                      sectionRefs.current[section.section] = el;
                    }
                  }}
                  data-section={section.section}
                  className="relative"
                  onMouseEnter={() => {
                    if (!sidebarOpen && section.section) {
                      const element = sectionRefs.current[section.section];
                      if (element) {
                        const rect = element.getBoundingClientRect();
                        setPopoverPosition({
                          top: rect.top,
                          left: rect.right + 8, // 8px margin
                        });
                        setHoveredSection(section.section);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (!sidebarOpen) {
                      // Clear any existing timeout
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                      // Delay hiding to allow moving to popover
                      hoverTimeoutRef.current = setTimeout(() => {
                        const popover =
                          document.querySelector(".hover-popover");
                        if (!popover?.matches(":hover")) {
                          setHoveredSection(null);
                          setPopoverPosition(null);
                        }
                        hoverTimeoutRef.current = null;
                      }, 200);
                    }
                  }}
                >
                  {sidebarOpen ? (
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() =>
                        section.section && toggleSection(section.section)
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-between ${
                            hasActiveChild
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold hover:from-indigo-100 hover:to-purple-100"
                              : "text-gray-700 hover:bg-gray-100"
                          } relative`}
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
                            <span className="ml-2.5 font-semibold">
                              {section.name}
                            </span>
                          </div>
                          {section.children && (
                            <div
                              className={
                                hasActiveChild ? "text-indigo-600" : ""
                              }
                            >
                              {isExpanded ? (
                                <FiChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <FiChevronRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {section.children.map((child) => {
                            const ChildIcon = child.icon;
                            // Check if child has nested children - Using shadcn/ui Collapsible
                            if (child.children && child.section) {
                              const isChildExpanded =
                                expandedSections[child.section] ?? false;
                              const hasActiveGrandchild = child.children.some(
                                (grandchild) =>
                                  grandchild.path
                                    ? isActive(grandchild.path)
                                    : false
                              );
                              return (
                                <Collapsible
                                  key={child.section}
                                  open={isChildExpanded}
                                  onOpenChange={() =>
                                    child.section &&
                                    toggleSection(child.section)
                                  }
                                  className="space-y-0.5"
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className={`w-full justify-between px-3 py-1.5 h-auto text-xs relative ${
                                        hasActiveGrandchild
                                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold hover:from-indigo-100 hover:to-purple-100"
                                          : "text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      {hasActiveGrandchild && (
                                        <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full" />
                                      )}
                                      <div className="flex items-center">
                                        <ChildIcon
                                          className={`w-3.5 h-3.5 mr-2 ${
                                            hasActiveGrandchild
                                              ? "text-indigo-600"
                                              : ""
                                          }`}
                                        />
                                        <span>{child.name}</span>
                                      </div>
                                      {isChildExpanded ? (
                                        <FiChevronDown className="w-3 h-3" />
                                      ) : (
                                        <FiChevronRight className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="ml-4 mt-0.5 space-y-0.5">
                                      {child.children.map((grandchild) => {
                                        if (
                                          grandchild.children &&
                                          grandchild.section
                                        ) {
                                          // Handle 4th level - Using shadcn/ui Collapsible
                                          const isGrandchildExpanded =
                                            expandedSections[
                                              grandchild.section
                                            ] ?? false;
                                          const hasActiveGreatGrandchild =
                                            grandchild.children.some((ggc) =>
                                              ggc.path
                                                ? isActive(ggc.path)
                                                : false
                                            );
                                          const GrandchildIcon =
                                            grandchild.icon;
                                          return (
                                            <Collapsible
                                              key={grandchild.section}
                                              open={isGrandchildExpanded}
                                              onOpenChange={() =>
                                                grandchild.section &&
                                                toggleSection(
                                                  grandchild.section
                                                )
                                              }
                                              className="space-y-0.5"
                                            >
                                              <CollapsibleTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  className={`w-full justify-between px-3 py-1.5 h-auto text-xs relative ${
                                                    hasActiveGreatGrandchild
                                                      ? "bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                                                      : "text-gray-600 hover:bg-gray-50"
                                                  }`}
                                                >
                                                  <div className="flex items-center">
                                                    <GrandchildIcon className="w-3 h-3 mr-2" />
                                                    <span>
                                                      {grandchild.name}
                                                    </span>
                                                  </div>
                                                  {isGrandchildExpanded ? (
                                                    <FiChevronDown className="w-2.5 h-2.5" />
                                                  ) : (
                                                    <FiChevronRight className="w-2.5 h-2.5" />
                                                  )}
                                                </Button>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="ml-4 mt-0.5 space-y-0.5">
                                                  {grandchild.children.map(
                                                    (ggc) => {
                                                      const GGCIcon = ggc.icon;
                                                      const isGGCActive =
                                                        ggc.path
                                                          ? isActive(ggc.path)
                                                          : false;
                                                      return (
                                                        <Button
                                                          key={ggc.path}
                                                          asChild
                                                          variant="ghost"
                                                          className={`w-full justify-start px-3 py-1 h-auto text-xs ${
                                                            isGGCActive
                                                              ? "bg-indigo-100 text-indigo-700 font-medium"
                                                              : "text-gray-600 hover:bg-gray-50"
                                                          }`}
                                                        >
                                                          <Link to={ggc.path!}>
                                                            <GGCIcon className="w-3 h-3 mr-2" />
                                                            {ggc.name}
                                                          </Link>
                                                        </Button>
                                                      );
                                                    }
                                                  )}
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          );
                                        }
                                        // Regular grandchild with path - Using shadcn/ui Button
                                        const GrandchildIcon = grandchild.icon;
                                        const isGrandchildActive =
                                          grandchild.path
                                            ? isActive(grandchild.path)
                                            : false;
                                        return (
                                          <Button
                                            key={grandchild.path}
                                            asChild
                                            variant="ghost"
                                            className={`w-full justify-start px-3 py-1 h-auto text-xs ${
                                              isGrandchildActive
                                                ? "bg-indigo-100 text-indigo-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                          >
                                            <Link to={grandchild.path!}>
                                              <GrandchildIcon className="w-3 h-3 mr-2" />
                                              {grandchild.name}
                                            </Link>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            }
                            // Regular child with path - Using shadcn/ui Button
                            const isChildActive = child.path
                              ? isActive(child.path)
                              : false;
                            return (
                              <Button
                                key={child.path}
                                asChild
                                variant="ghost"
                                className={`w-full justify-start px-3 py-1.5 h-auto text-xs relative ${
                                  isChildActive
                                    ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <Link to={child.path!}>
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
                              </Button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <>
                      {/* Collapsed: Show icon button - Using shadcn/ui Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-full relative ${
                          hasActiveChild
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        title={section.name}
                      >
                        {hasActiveChild && (
                          <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full" />
                        )}
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            hasActiveChild ? "text-indigo-600" : ""
                          }`}
                        />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Render popover via portal outside sidebar */}
          {hoveredSection &&
            popoverPosition &&
            !sidebarOpen &&
            (() => {
              const section = superAdminSections.find(
                (s) => s.section === hoveredSection
              );
              if (!section?.children) return null;

              return createPortal(
                <div
                  className="hover-popover fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2"
                  style={{
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`,
                    zIndex: 99999,
                    pointerEvents: "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    // Clear any pending timeout when entering popover
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setHoveredSection(hoveredSection);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    // Delay hiding when leaving popover
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredSection(null);
                      setPopoverPosition(null);
                      hoverTimeoutRef.current = null;
                    }, 200);
                  }}
                >
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-900">
                      {section.name}
                    </p>
                  </div>
                  <div className="py-1">
                    {section.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = isActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => {
                            setHoveredSection(null);
                            setPopoverPosition(null);
                          }}
                          className={`${
                            isChildActive
                              ? "bg-indigo-50 text-indigo-700 font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          } flex items-center gap-2 px-3 py-2 text-sm transition-smooth`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>,
                document.body
              );
            })()}

          {/* Sidebar Footer - Only show when open - Using shadcn/ui Card */}
          {sidebarOpen && (
            <div className="p-3 border-t border-gray-200">
              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-3">
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
                </CardContent>
              </Card>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 transition-all duration-300 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 lg:px-6 py-2">
              <div className="flex items-center justify-between">
                {/* Mobile Menu Button */}
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-smooth lg:hidden"
                  >
                    <FiMenu className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div className="flex-1" /> {/* Spacer */}
                {/* Right Side: Notifications & User Menu */}
                <div className="flex items-center gap-2">
                  {/* Notifications - Using shadcn/ui DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="relative p-2 hover:bg-gray-100 rounded-lg transition-smooth"
                        title="Notifications"
                      >
                        <FiBell className="w-5 h-5 text-gray-600" />
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-destructive-foreground border-2 border-white">
                          <span className="text-[8px]">!</span>
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <Separator />
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No new notifications
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">
            {children}
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
