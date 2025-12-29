# Super Admin Features Documentation

> **Last Updated:** 2024-12-19  
> **Status:** Active Development  
> **Focus:** Super Admin Module Only

This document tracks all Super Admin features, current implementations, and planned enhancements.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Super Admin Access](#super-admin-access)
- [Backend Module](#backend-module)
- [Frontend Module](#frontend-module)
- [School Management](#school-management)
- [User Management](#user-management)
- [Dashboard & Analytics](#dashboard--analytics)
- [API Endpoints](#api-endpoints)
- [Security & Permissions](#security--permissions)
- [Planned Features](#planned-features)
- [Technical Implementation](#technical-implementation)

---

## 🎯 Overview

The Super Admin module is a separate, isolated module that provides platform-wide management capabilities. It operates independently from school-specific modules and has unrestricted access to all platform data.

**Key Characteristics:**
- ✅ Separate backend module (`super-admin`)
- ✅ Separate frontend routes (`/super-admin/*`)
- ✅ Platform-wide access (all schools)
- ✅ Can manage all users and schools
- ✅ Only one Super Admin user exists
- ✅ Cannot be created through normal user registration

---

## 🔐 Super Admin Access

### Authentication
- **Login:** Uses same authentication endpoint (`/auth/login`)
- **Role:** `SUPER_ADMIN` (enum value: `super_admin`)
- **Token:** JWT token with role claim
- **Access:** All `/super-admin/*` routes require `SUPER_ADMIN` role

### Role Guard
- **Backend:** `@Roles(UserRole.SUPER_ADMIN)` decorator
- **Frontend:** Role check in components (`user?.role === 'super_admin'`)
- **Access Denied:** Shows "Access Denied" message for non-Super Admin users

### Initial Setup
- Created via script: `npm run create:admin`
- Script location: `backend/src/scripts/create-admin.ts`
- Default credentials: Set during script execution

---

## 🏗 Backend Module

### Module Structure
```
backend/src/super-admin/
├── super-admin.controller.ts    # API endpoints
├── super-admin.service.ts       # Business logic
└── super-admin.module.ts        # Module definition
```

### Dependencies
- `SchoolsModule` - For school management
- `UsersModule` - For user management
- `JwtAuthGuard` - Authentication guard
- `RolesGuard` - Role-based access control

### Service Methods

#### School Management
- `createSchool()` - Create school + auto-create default admin
- `findAllSchools()` - Get all schools
- `findOneSchool()` - Get school by ID
- `updateSchool()` - Update school details
- `removeSchool()` - Delete school

#### User Management
- `createUser()` - Create any user with any role
- `findAllUsers()` - Get all users across all schools
- `findOneUser()` - Get user by ID
- `updateUser()` - Update user details
- `removeUser()` - Delete user

#### Dashboard
- `getDashboardStats()` - Platform-wide statistics

---

## 🎨 Frontend Module

### Route Structure
```
/super-admin/
├── /dashboard          # Platform overview
├── /schools            # Schools management
└── /users              # Users management
```

### Component Structure
```
frontend/src/pages/super-admin/
├── Dashboard.tsx       # Super Admin dashboard
├── Schools.tsx         # Schools CRUD page
└── Users.tsx           # Users CRUD page
```

### Navigation
- Super Admin navigation in `Layout.tsx`
- Conditional rendering based on role
- Separate menu items for Super Admin routes

---

## 🏢 School Management

**Status:** ✅ Implemented  
**Priority:** High

### Features

#### Create School
- ✅ Create new school with all details
- ✅ Auto-create default admin user
- ✅ Default admin credentials:
  - Email: `admin@<subdomain>.school`
  - Password: `<subdomain>_admin123`
  - Role: `ADMINISTRATOR`
- ✅ School subdomain validation
- ✅ School status management

**Form Fields:**
- School Name (required)
- Subdomain (required, unique)
- Email (optional)
- Phone (optional)
- Address (optional)
- Status (required: active/inactive/suspended)

#### List Schools
- ✅ View all schools in platform
- ✅ Display school details (name, subdomain, contact, status)
- ✅ Search/filter functionality (planned)
- ✅ Pagination (planned)

#### Update School
- ✅ Edit school details
- ✅ Update school status
- ✅ Change subdomain (with validation)

#### Delete School
- ✅ Remove school from platform
- ⚠️ Cascade delete considerations (planned)

### API Endpoints

```
POST   /super-admin/schools          # Create school
GET    /super-admin/schools          # List all schools
GET    /super-admin/schools/:id      # Get school details
PATCH  /super-admin/schools/:id      # Update school
DELETE /super-admin/schools/:id      # Delete school
```

### Frontend Page
**Location:** `/super-admin/schools`

**Features:**
- ✅ Table view of all schools
- ✅ Add school modal
- ✅ Edit school modal
- ✅ Delete confirmation
- ✅ Status badges
- ✅ Subdomain display
- ✅ Contact information display

**UI Components:**
- Glassmorphism design
- Gradient buttons
- Modal forms
- Status indicators
- Responsive table

### Planned Enhancements
- [ ] Bulk school import (CSV/Excel)
- [ ] School analytics per school
- [ ] School activity logs
- [ ] School settings/preferences
- [ ] School branding customization
- [ ] School subscription/billing management
- [ ] School data export
- [ ] Advanced search and filtering
- [ ] Pagination for large datasets
- [ ] School comparison view

---

## 👥 User Management

**Status:** ✅ Implemented  
**Priority:** High

### Features

#### Create User
- ✅ Create user with any role
- ✅ Assign user to any school
- ✅ Set user password
- ✅ Role selection (all roles available)
- ✅ School assignment (optional)

**Available Roles:**
- `SUPER_ADMIN` - Platform administrator
- `ADMINISTRATOR` - School administrator
- `ACCOUNTANT` - School accountant
- `STUDENT` - Student (not implemented)
- `PARENT` - Parent (not implemented)

**Form Fields:**
- Full Name (required)
- Email (required, unique)
- Password (required for new users)
- Role (required)
- School (optional)

#### List Users
- ✅ View all users across all schools
- ✅ Display user details (name, email, role, school)
- ✅ Filter by role (planned)
- ✅ Filter by school (planned)
- ✅ Search functionality (planned)

#### Update User
- ✅ Edit user details
- ✅ Change user role
- ✅ Reassign user to different school
- ✅ Update password (optional)

#### Delete User
- ✅ Remove user from platform
- ⚠️ Cannot delete own account (planned)

### API Endpoints

```
POST   /super-admin/users          # Create user
GET    /super-admin/users          # List all users
GET    /super-admin/users/:id      # Get user details
PATCH  /super-admin/users/:id      # Update user
DELETE /super-admin/users/:id      # Delete user
```

### Frontend Page
**Location:** `/super-admin/users`

**Features:**
- ✅ Table view of all users
- ✅ Add user modal
- ✅ Edit user modal
- ✅ Delete confirmation
- ✅ Role badges
- ✅ School assignment display
- ✅ Email display

**UI Components:**
- Glassmorphism design
- Role-based color coding
- School name display
- Responsive table
- Form validation

### Planned Enhancements
- [ ] Bulk user import (CSV/Excel)
- [ ] User activity logs
- [ ] User login history
- [ ] Force password reset
- [ ] User permissions management
- [ ] User groups/teams
- [ ] Advanced search and filtering
- [ ] Pagination for large datasets
- [ ] User export functionality
- [ ] User statistics per school

---

## 📊 Dashboard & Analytics

**Status:** ✅ Basic Implementation  
**Priority:** Medium

### Current Features

#### Platform Statistics
- ✅ Total Schools count
- ✅ Total Users count
- ✅ Total Students count (planned)
- ✅ Total Payments count (planned)
- ✅ Total Revenue (planned)

**Dashboard Cards:**
- Schools card with link to schools page
- Users card with link to users page
- Quick actions
- Refresh button

### Frontend Page
**Location:** `/super-admin/dashboard`

**Features:**
- ✅ Statistics cards
- ✅ Quick links to management pages
- ✅ Refresh functionality
- ✅ Welcome message
- ✅ Platform overview

**UI Components:**
- Gradient header
- Statistics cards
- Icon-based navigation
- Loading states
- Error handling

### Planned Enhancements
- [ ] Advanced analytics dashboard
- [ ] Charts and graphs
  - [ ] Schools growth over time
  - [ ] Users growth over time
  - [ ] Revenue trends
  - [ ] Payment trends
- [ ] School comparison metrics
- [ ] Top performing schools
- [ ] Recent activity feed
- [ ] Platform health monitoring
- [ ] Custom date range filters
- [ ] Export reports (PDF, Excel)
- [ ] Scheduled reports
- [ ] Real-time statistics
- [ ] Geographic distribution (if location data available)

---

## 🔌 API Endpoints

### Base URL
```
/super-admin
```

### Authentication
All endpoints require:
- JWT token in `Authorization` header
- `Bearer <token>` format
- Valid `SUPER_ADMIN` role

### Endpoints Summary

#### Schools
```
POST   /super-admin/schools
GET    /super-admin/schools
GET    /super-admin/schools/:id
PATCH  /super-admin/schools/:id
DELETE /super-admin/schools/:id
```

#### Users
```
POST   /super-admin/users
GET    /super-admin/users
GET    /super-admin/users/:id
PATCH  /super-admin/users/:id
DELETE /super-admin/users/:id
```

#### Dashboard
```
GET    /super-admin/dashboard-stats
```

### Request/Response Examples

#### Create School
```json
POST /super-admin/schools
{
  "name": "ABC School",
  "subdomain": "abc",
  "email": "contact@abcschool.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "status": "active"
}

Response:
{
  "school": {
    "id": 1,
    "name": "ABC School",
    "subdomain": "abc",
    ...
  },
  "defaultAdmin": {
    "id": 1,
    "email": "admin@abc.school",
    "role": "administrator",
    ...
  }
}
```

#### Create User
```json
POST /super-admin/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "administrator",
  "schoolId": 1
}

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "administrator",
  "schoolId": 1,
  ...
}
```

---

## 🔒 Security & Permissions

### Current Security Measures

#### Backend
- ✅ JWT authentication required
- ✅ Role-based guard (`@Roles(UserRole.SUPER_ADMIN)`)
- ✅ Request validation (DTOs)
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (ThrottlerModule)

#### Frontend
- ✅ Protected routes
- ✅ Role check in components
- ✅ Access denied page
- ✅ Token storage (localStorage)
- ✅ Token expiration handling

### Permissions Matrix

| Action | Super Admin | Administrator | Accountant |
|--------|-------------|---------------|------------|
| Create School | ✅ | ❌ | ❌ |
| View All Schools | ✅ | ❌ | ❌ |
| Create Any User | ✅ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ |
| Change User Role | ✅ | ❌ | ❌ |
| Assign User to Any School | ✅ | ❌ | ❌ |

### Planned Security Enhancements
- [ ] IP whitelist for Super Admin
- [ ] Two-factor authentication (2FA)
- [ ] Session management
- [ ] Audit logging
- [ ] Activity monitoring
- [ ] Failed login attempt tracking
- [ ] Account lockout mechanism
- [ ] Password policy enforcement
- [ ] API key management (for integrations)

---

## 🚀 Planned Features

### High Priority
- [ ] **Advanced Analytics Dashboard**
  - Charts and graphs
  - Trend analysis
  - Comparative metrics
  
- [ ] **School Analytics**
  - Per-school statistics
  - School performance metrics
  - Student enrollment trends
  
- [ ] **User Activity Logs**
  - Track all Super Admin actions
  - Audit trail
  - Activity history
  
- [ ] **Bulk Operations**
  - Bulk school import
  - Bulk user import
  - Bulk school activation/deactivation

### Medium Priority
- [ ] **School Settings Management**
  - Platform-wide settings
  - School-specific defaults
  - Feature flags per school
  
- [ ] **Subscription/Billing Management**
  - School subscription tracking
  - Payment management
  - Billing history
  
- [ ] **Reports & Exports**
  - Platform reports
  - School reports export
  - User reports export
  - Custom report builder
  
- [ ] **Notifications Management**
  - Platform-wide notifications
  - School notifications
  - Notification templates

### Low Priority
- [ ] **API Management**
  - API key generation
  - API usage tracking
  - API documentation
  
- [ ] **Integration Management**
  - Third-party integrations
  - Webhook management
  - Integration status monitoring
  
- [ ] **Backup & Recovery**
  - Data backup management
  - Restore functionality
  - Backup scheduling
  
- [ ] **System Health Monitoring**
  - Server status
  - Database health
  - Performance metrics

---

## 🛠 Technical Implementation

### Backend Files

#### Controller
**File:** `backend/src/super-admin/super-admin.controller.ts`
- Handles all HTTP requests
- Uses `@UseGuards(JwtAuthGuard)` and `@Roles(UserRole.SUPER_ADMIN)`
- Swagger documentation with `@ApiTags`, `@ApiOperation`, `@ApiResponse`

#### Service
**File:** `backend/src/super-admin/super-admin.service.ts`
- Business logic implementation
- Orchestrates school and user creation
- Auto-creates default admin user

#### Module
**File:** `backend/src/super-admin/super-admin.module.ts`
- Module definition
- Imports `SchoolsModule` and `UsersModule`
- Exports `SuperAdminService`

### Frontend Files

#### Dashboard
**File:** `frontend/src/pages/super-admin/Dashboard.tsx`
- Platform overview
- Statistics display
- Quick navigation

#### Schools Page
**File:** `frontend/src/pages/super-admin/Schools.tsx`
- Schools CRUD operations
- Modal forms
- Table display

#### Users Page
**File:** `frontend/src/pages/super-admin/Users.tsx`
- Users CRUD operations
- Modal forms
- Table display

#### Services
**Files:**
- `frontend/src/services/schools.service.ts`
- `frontend/src/services/users.service.ts`

### Routing

#### Backend Routes
Registered in `app.module.ts`:
```typescript
imports: [
  ...
  SuperAdminModule,
]
```

#### Frontend Routes
**File:** `frontend/src/App.tsx`
```typescript
<Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
<Route path="/super-admin/schools" element={<SuperAdminSchools />} />
<Route path="/super-admin/users" element={<SuperAdminUsers />} />
```

### Navigation
**File:** `frontend/src/components/Layout.tsx`
- Conditional rendering based on role
- Super Admin menu items
- Access control

---

## 📝 Notes

### Current Limitations
- Default admin password is logged to console (should be emailed in production)
- No email service integration for credentials
- No bulk operations yet
- No advanced analytics yet
- No audit logging yet

### Best Practices
- Super Admin should use strong passwords
- Super Admin actions should be logged
- Regular security audits recommended
- Backup Super Admin credentials securely

### Future Considerations
- Separate Super Admin database (if needed for scale)
- Super Admin API rate limiting (stricter)
- Super Admin activity monitoring dashboard
- Super Admin notification system

---

## 🔄 Changelog

### Version 1.0.0 (2024-12-19)
- ✅ Initial Super Admin module implementation
- ✅ Separate backend module (`super-admin`)
- ✅ Separate frontend routes (`/super-admin/*`)
- ✅ School management (CRUD)
- ✅ User management (CRUD)
- ✅ Auto-create default admin user when school is created
- ✅ Dashboard with basic statistics
- ✅ Role-based access control
- ✅ Glassmorphism UI design

---

**Document Maintained By:** Development Team  
**Last Review Date:** 2024-12-19  
**Next Review Date:** TBD

