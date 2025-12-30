# Database Schema Documentation

## Overview

This document describes the database schema for the School ERP Fee Management System. The schema is designed to support multi-school fee management with category heads, fee categories, fee structures, and payment tracking.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Fee Management Tables](#fee-management-tables)
3. [Payment Tables](#payment-tables)
4. [Entity Relationships](#entity-relationships)
5. [Enums](#enums)
6. [Indexes](#indexes)
7. [Constraints](#constraints)
8. [Version History](#version-history)

---

## Core Tables

### `schools`

Master table for all schools in the system.

| Column        | Type         | Constraints                 | Description                         |
| ------------- | ------------ | --------------------------- | ----------------------------------- |
| `id`          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                   |
| `name`        | VARCHAR(255) | NOT NULL                    | School name                         |
| `subdomain`   | VARCHAR(255) | NOT NULL, UNIQUE            | Unique subdomain identifier         |
| `email`       | VARCHAR(255) | NULLABLE                    | School email address                |
| `phone`       | VARCHAR(255) | NULLABLE                    | School phone number                 |
| `address`     | TEXT         | NULLABLE                    | School address                      |
| `logo`        | VARCHAR(255) | NULLABLE                    | Logo file path                      |
| `settings`    | JSONB        | NULLABLE                    | School-specific settings            |
| `status`      | ENUM         | NOT NULL, DEFAULT 'active'  | School status (see [Enums](#enums)) |
| `createdById` | INTEGER      | NULLABLE, FK → users.id     | User who created the school         |
| `createdAt`   | TIMESTAMP    | NOT NULL                    | Creation timestamp                  |
| `updatedAt`   | TIMESTAMP    | NOT NULL                    | Last update timestamp               |

**Relationships:**

- One-to-Many: `students` → `Student[]`
- One-to-Many: `feeCategories` → `FeeCategory[]`
- One-to-Many: `feeStructures` → `FeeStructure[]`
- One-to-Many: `categoryHeads` → `CategoryHead[]`
- One-to-Many: `payments` → `Payment[]`
- One-to-Many: `classes` → `Class[]`
- Many-to-One: `createdBy` → `User`

---

### `users`

User accounts for administrators, accountants, super admins, students, and parents.

| Column            | Type         | Constraints                 | Description                              |
| ----------------- | ------------ | --------------------------- | ---------------------------------------- |
| `id`              | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                        |
| `schoolId`        | INTEGER      | NULLABLE, FK → schools.id   | Associated school (null for super_admin) |
| `name`            | VARCHAR(255) | NOT NULL                    | Full name                                |
| `email`           | VARCHAR(255) | NOT NULL, UNIQUE            | User email (login)                       |
| `emailVerifiedAt` | TIMESTAMP    | NULLABLE                    | Email verification timestamp             |
| `password`        | VARCHAR(255) | NOT NULL                    | Hashed password                          |
| `role`            | ENUM         | NOT NULL, DEFAULT 'student' | User role (see [Enums](#enums))          |
| `rememberToken`   | VARCHAR(255) | NULLABLE                    | Remember me token                        |
| `createdAt`       | TIMESTAMP    | NOT NULL                    | Creation timestamp                       |
| `updatedAt`       | TIMESTAMP    | NOT NULL                    | Last update timestamp                    |

**Relationships:**

- Many-to-One: `school` → `School` (optional)
- One-to-Many: `schools` → `School[]` (schools created by this user)

---

### `students`

Student records linked to schools.

| Column      | Type         | Constraints                 | Description                          |
| ----------- | ------------ | --------------------------- | ------------------------------------ |
| `id`        | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                    |
| `schoolId`  | INTEGER      | NOT NULL, FK → schools.id   | School this student belongs to       |
| `userId`    | INTEGER      | NULLABLE, FK → users.id     | Associated user account (if any)     |
| `studentId` | VARCHAR(255) | NOT NULL                    | Unique student ID within school      |
| `firstName` | VARCHAR(255) | NOT NULL                    | First name                           |
| `lastName`  | VARCHAR(255) | NOT NULL                    | Last name                            |
| `email`     | VARCHAR(255) | NOT NULL                    | Email address                        |
| `phone`     | VARCHAR(255) | NULLABLE                    | Phone number                         |
| `address`   | TEXT         | NULLABLE                    | Address                              |
| `class`     | VARCHAR(255) | NOT NULL                    | Class/Grade                          |
| `section`   | VARCHAR(255) | NULLABLE                    | Section                              |
| `status`    | ENUM         | NOT NULL, DEFAULT 'active'  | Student status (see [Enums](#enums)) |
| `createdAt` | TIMESTAMP    | NOT NULL                    | Creation timestamp                   |
| `updatedAt` | TIMESTAMP    | NOT NULL                    | Last update timestamp                |

**Relationships:**

- Many-to-One: `school` → `School`
- Many-to-One: `user` → `User` (optional)
- One-to-Many: `payments` → `Payment[]`
- One-to-Many: `feeStructures` → `StudentFeeStructure[]`

---

### `classes`

Class/Grade definitions for schools.

| Column        | Type         | Constraints                 | Description                         |
| ------------- | ------------ | --------------------------- | ----------------------------------- |
| `id`          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                   |
| `schoolId`    | INTEGER      | NOT NULL, FK → schools.id   | School this class belongs to        |
| `name`        | VARCHAR(255) | NOT NULL                    | Class name (e.g., "Grade 1")        |
| `description` | TEXT         | NULLABLE                    | Optional description                |
| `status`      | ENUM         | NOT NULL, DEFAULT 'active'  | Status: 'active' or 'inactive'      |
| `createdAt`   | TIMESTAMP    | NOT NULL                    | Creation timestamp                  |
| `updatedAt`   | TIMESTAMP    | NOT NULL                    | Last update timestamp               |

**Relationships:**

- Many-to-One: `school` → `School`

**Business Rules:**

- Name must be unique within a school
- Cannot delete if used by any students or fee structures

---

## Fee Management Tables

### `category_heads`

Category heads distinguish between different student types (e.g., General, Sponsored).

| Column        | Type         | Constraints                 | Description                                       |
| ------------- | ------------ | --------------------------- | ------------------------------------------------- |
| `id`          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                                 |
| `schoolId`    | INTEGER      | NOT NULL, FK → schools.id   | School this belongs to                            |
| `name`        | VARCHAR(255) | NOT NULL                    | Category head name (e.g., "General", "Sponsored") |
| `description` | TEXT         | NULLABLE                    | Optional description                              |
| `status`      | ENUM         | NOT NULL, DEFAULT 'active'  | Status: 'active' or 'inactive'                    |
| `createdAt`   | TIMESTAMP    | NOT NULL                    | Creation timestamp                                |
| `updatedAt`   | TIMESTAMP    | NOT NULL                    | Last update timestamp                             |

**Relationships:**

- Many-to-One: `school` → `School`
- One-to-Many: `feeStructures` → `FeeStructure[]`

**Business Rules:**

- Cannot delete if used by any fee structures
- Name must be unique within a school

---

### `fee_categories`

Fee categories/headings (e.g., "Tuition Fee", "Library Fee", "Transport Fee").

| Column             | Type         | Constraints                 | Description                                            |
| ------------------ | ------------ | --------------------------- | ------------------------------------------------------ |
| `id`               | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique identifier                                      |
| `schoolId`         | INTEGER      | NOT NULL, FK → schools.id   | School this belongs to                                 |
| `name`             | VARCHAR(255) | NOT NULL                    | Category name (e.g., "Tuition Fee")                    |
| `description`      | TEXT         | NULLABLE                    | Optional description                                   |
| `type`             | ENUM         | NOT NULL, DEFAULT 'school'  | Fee type: 'school' or 'transport'                      |
| `status`           | ENUM         | NOT NULL, DEFAULT 'active'  | Status: 'active' or 'inactive'                         |
| `applicableMonths` | JSON         | NULLABLE                    | Array of month numbers [1-12]. Empty/null = all months |
| `createdAt`        | TIMESTAMP    | NOT NULL                    | Creation timestamp                                     |
| `updatedAt`        | TIMESTAMP    | NOT NULL                    | Last update timestamp                                  |

**Relationships:**

- Many-to-One: `school` → `School`
- One-to-Many: `feeStructures` → `FeeStructure[]`

**Business Rules:**

- Name must be unique within a school when combined with `type` (same name can exist with different types)
- Example: "Tuition Fee" with type "school" and "Tuition Fee" with type "transport" are allowed
- `applicableMonths` is a JSON array: `[1,2,3]` means Jan, Feb, Mar
- Empty array or null means applicable to all 12 months

**Example `applicableMonths` values:**

- `null` or `[]` → All months
- `[1,2,3,4,5,6,7,8,9,10,11,12]` → All months (explicit)
- `[3,6,9,12]` → Quarterly (Mar, Jun, Sep, Dec)
- `[1]` → January only

---

### `fee_structures`

Fee structures/plans that combine fee categories with category heads, amounts, classes, and academic years.

| Column           | Type          | Constraints                      | Description                                   |
| ---------------- | ------------- | -------------------------------- | --------------------------------------------- |
| `id`             | INTEGER       | PRIMARY KEY, AUTO_INCREMENT      | Unique identifier                             |
| `schoolId`       | INTEGER       | NOT NULL, FK → schools.id        | School this belongs to                        |
| `feeCategoryId`  | INTEGER       | NOT NULL, FK → fee_categories.id | Reference to fee category                     |
| `categoryHeadId` | INTEGER       | NULLABLE, FK → category_heads.id | Reference to category head (optional)         |
| `name`           | VARCHAR(255)  | NOT NULL                         | Structure/plan name                           |
| `description`    | TEXT          | NULLABLE                         | Optional description                          |
| `amount`         | DECIMAL(10,2) | NOT NULL                         | Fee amount                                    |
| `class`          | VARCHAR(255)  | NULLABLE                         | Applicable class (e.g., "Grade 1", "Grade 2") |
| `academicYear`   | VARCHAR(255)  | NULLABLE                         | Academic year (e.g., "2024-2025")             |
| `dueDate`        | DATE          | NULLABLE                         | Due date for payment                          |
| `status`         | ENUM          | NOT NULL, DEFAULT 'active'       | Status: 'active' or 'inactive'                |
| `createdAt`      | TIMESTAMP     | NOT NULL                         | Creation timestamp                            |
| `updatedAt`      | TIMESTAMP     | NOT NULL                         | Last update timestamp                         |

**Relationships:**

- Many-to-One: `school` → `School`
- Many-to-One: `category` → `FeeCategory`
- Many-to-One: `categoryHead` → `CategoryHead` (optional)
- One-to-Many: `payments` → `Payment[]`
- One-to-Many: `studentStructures` → `StudentFeeStructure[]`

**Business Rules:**

- Links a Fee Category with a Category Head to create specific fee plans
- Example: "Tuition Fee" (category) + "General" (category head) = "Tuition Fee for General Students"
- Same fee category can have multiple structures for different category heads
- `academicYear` and `dueDate` are optional fields (nullable)
- `class` field stores the class name as a string (can reference `classes` table in future)

---

## Payment Tables

### `student_fee_structures`

Junction table linking students to fee structures (assigns fees to students).

| Column           | Type          | Constraints                      | Description                                                 |
| ---------------- | ------------- | -------------------------------- | ----------------------------------------------------------- |
| `id`             | INTEGER       | PRIMARY KEY, AUTO_INCREMENT      | Unique identifier                                           |
| `studentId`      | INTEGER       | NOT NULL, FK → students.id       | Student reference                                           |
| `feeStructureId` | INTEGER       | NOT NULL, FK → fee_structures.id | Fee structure reference                                     |
| `amount`         | DECIMAL(10,2) | NOT NULL                         | Fee amount for this student (can override structure amount) |
| `dueDate`        | DATE          | NOT NULL                         | Due date for this student                                   |
| `status`         | ENUM          | NOT NULL, DEFAULT 'pending'      | Payment status: 'pending', 'paid', or 'overdue'             |
| `createdAt`      | TIMESTAMP     | NOT NULL                         | Creation timestamp                                          |
| `updatedAt`      | TIMESTAMP     | NOT NULL                         | Last update timestamp                                       |

**Unique Constraint:** `(studentId, feeStructureId)` - One record per student per fee structure

**Relationships:**

- Many-to-One: `student` → `Student`
- Many-to-One: `feeStructure` → `FeeStructure`

**Business Rules:**

- Prevents duplicate assignments of the same fee structure to a student
- Amount can be customized per student (e.g., discounts, scholarships)

---

### `payments`

Payment records tracking actual payments made by students.

| Column           | Type          | Constraints                      | Description                          |
| ---------------- | ------------- | -------------------------------- | ------------------------------------ |
| `id`             | INTEGER       | PRIMARY KEY, AUTO_INCREMENT      | Unique identifier                    |
| `schoolId`       | INTEGER       | NOT NULL, FK → schools.id        | School this belongs to               |
| `studentId`      | INTEGER       | NOT NULL, FK → students.id       | Student who made payment             |
| `feeStructureId` | INTEGER       | NOT NULL, FK → fee_structures.id | Fee structure paid for               |
| `amount`         | DECIMAL(10,2) | NOT NULL                         | Payment amount                       |
| `paymentDate`    | DATE          | NOT NULL                         | Date of payment                      |
| `paymentMethod`  | ENUM          | NOT NULL, DEFAULT 'cash'         | Payment method (see [Enums](#enums)) |
| `transactionId`  | VARCHAR(255)  | NULLABLE, UNIQUE                 | Transaction ID (for online payments) |
| `status`         | ENUM          | NOT NULL, DEFAULT 'pending'      | Payment status (see [Enums](#enums)) |
| `notes`          | TEXT          | NULLABLE                         | Additional notes                     |
| `createdAt`      | TIMESTAMP     | NOT NULL                         | Creation timestamp                   |
| `updatedAt`      | TIMESTAMP     | NOT NULL                         | Last update timestamp                |

**Relationships:**

- Many-to-One: `school` → `School`
- Many-to-One: `student` → `Student`
- Many-to-One: `feeStructure` → `FeeStructure`

**Business Rules:**

- `transactionId` is unique (for online payment tracking)
- Links to both student and fee structure for complete payment history

---

## Entity Relationships

### Relationship Diagram

```
schools (1)
  ├── (M) users
  ├── (M) students
  ├── (M) classes
  ├── (M) category_heads
  ├── (M) fee_categories
  │       └── (M) fee_structures
  │               ├── (M) student_fee_structures ──→ students
  │               └── (M) payments ──→ students
  └── (M) payments

category_heads (1)
  └── (M) fee_structures

fee_structures (1)
  ├── (M) student_fee_structures
  └── (M) payments
```

### Key Relationships

1. **School → Classes**: One school has many classes
2. **School → Fee Categories**: One school has many fee categories
3. **School → Category Heads**: One school has many category heads
4. **Fee Category → Fee Structures**: One fee category can have many fee structures
5. **Category Head → Fee Structures**: One category head can have many fee structures
6. **Fee Structure → Student Fee Structures**: One fee structure can be assigned to many students
7. **Fee Structure → Payments**: One fee structure can have many payment records
8. **Student → Student Fee Structures**: One student can have many fee assignments
9. **Student → Payments**: One student can make many payments

---

## Enums

### `SchoolStatus`

- `ACTIVE` - School is active and operational
- `INACTIVE` - School is inactive
- `SUSPENDED` - School is suspended

### `UserRole`

- `SUPER_ADMIN` - System super administrator
- `ADMINISTRATOR` - School administrator
- `ACCOUNTANT` - School accountant
- `STUDENT` - Student user
- `PARENT` - Parent user

### `CategoryHeadStatus`

- `ACTIVE` - Category head is active
- `INACTIVE` - Category head is inactive

### `CategoryStatus` (Fee Categories)

- `ACTIVE` - Fee category is active
- `INACTIVE` - Fee category is inactive

### `FeeCategoryType`

- `SCHOOL` - School fee (tuition, library, etc.)
- `TRANSPORT` - Transport fee

### `StructureStatus` (Fee Structures)

- `ACTIVE` - Fee structure is active
- `INACTIVE` - Fee structure is inactive

### `PaymentStatus` (Student Fee Structures)

- `PENDING` - Payment pending
- `PAID` - Payment completed
- `OVERDUE` - Payment overdue

### `PaymentMethod`

- `CASH` - Cash payment
- `BANK_TRANSFER` - Bank transfer
- `CARD` - Card payment
- `ONLINE` - Online payment
- `CHEQUE` - Cheque payment

### `PaymentStatus` (Payments)

- `PENDING` - Payment pending
- `COMPLETED` - Payment completed
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

### `StudentStatus`

- `ACTIVE` - Student is active
- `INACTIVE` - Student is inactive
- `GRADUATED` - Student has graduated

### `ClassStatus`

- `ACTIVE` - Class is active
- `INACTIVE` - Class is inactive

---

## Data Flow Example

### Creating a Fee Plan

1. **Create Category Head**: "General" or "Sponsored"

   ```sql
   INSERT INTO category_heads (name, schoolId, status)
   VALUES ('General', 1, 'active');
   ```

2. **Create Fee Category**: "Tuition Fee"

   ```sql
   INSERT INTO fee_categories (name, type, schoolId, status, applicableMonths)
   VALUES ('Tuition Fee', 'school', 1, 'active', '[1,2,3,4,5,6,7,8,9,10,11,12]');
   ```

3. **Create Fee Structure**: Combine Category + Category Head

   ```sql
   INSERT INTO fee_structures (feeCategoryId, categoryHeadId, name, amount, class, academicYear, schoolId, status)
   VALUES (1, 1, 'Tuition Fee for General Students - Grade 1', 500.00, 'Grade 1', '2024-2025', 1, 'active');
   ```
   
   Note: `academicYear` and `dueDate` are optional and can be NULL.

4. **Assign to Student**: Create student fee structure

   ```sql
   INSERT INTO student_fee_structures (studentId, feeStructureId, amount, dueDate, status)
   VALUES (1, 1, 500.00, '2024-01-15', 'pending');
   ```

5. **Record Payment**: When student pays
   ```sql
   INSERT INTO payments (studentId, feeStructureId, amount, paymentDate, paymentMethod, status, schoolId)
   VALUES (1, 1, 500.00, '2024-01-10', 'cash', 'completed', 1);
   ```

---

## Indexes

### Recommended Indexes

```sql
-- Schools
CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_subdomain ON schools(subdomain);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_schoolId ON users(schoolId);
CREATE INDEX idx_users_role ON users(role);

-- Students
CREATE INDEX idx_students_schoolId ON students(schoolId);
CREATE INDEX idx_students_studentId ON students(studentId);
CREATE INDEX idx_students_status ON students(status);

-- Classes
CREATE INDEX idx_classes_schoolId ON classes(schoolId);
CREATE INDEX idx_classes_status ON classes(status);

-- Category Heads
CREATE INDEX idx_category_heads_schoolId ON category_heads(schoolId);
CREATE INDEX idx_category_heads_status ON category_heads(status);

-- Fee Categories
CREATE INDEX idx_fee_categories_schoolId ON fee_categories(schoolId);
CREATE INDEX idx_fee_categories_type ON fee_categories(type);
CREATE INDEX idx_fee_categories_status ON fee_categories(status);

-- Fee Structures
CREATE INDEX idx_fee_structures_schoolId ON fee_structures(schoolId);
CREATE INDEX idx_fee_structures_feeCategoryId ON fee_structures(feeCategoryId);
CREATE INDEX idx_fee_structures_categoryHeadId ON fee_structures(categoryHeadId);
CREATE INDEX idx_fee_structures_academicYear ON fee_structures(academicYear);

-- Student Fee Structures
CREATE INDEX idx_student_fee_structures_studentId ON student_fee_structures(studentId);
CREATE INDEX idx_student_fee_structures_feeStructureId ON student_fee_structures(feeStructureId);
CREATE INDEX idx_student_fee_structures_status ON student_fee_structures(status);

-- Payments
CREATE INDEX idx_payments_studentId ON payments(studentId);
CREATE INDEX idx_payments_feeStructureId ON payments(feeStructureId);
CREATE INDEX idx_payments_schoolId ON payments(schoolId);
CREATE INDEX idx_payments_paymentDate ON payments(paymentDate);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## Constraints

### Foreign Key Constraints

- `schools.createdById` → `users.id`
- `users.schoolId` → `schools.id`
- `students.schoolId` → `schools.id`
- `students.userId` → `users.id`
- `classes.schoolId` → `schools.id`
- `category_heads.schoolId` → `schools.id`
- `fee_categories.schoolId` → `schools.id`
- `fee_structures.schoolId` → `schools.id`
- `fee_structures.feeCategoryId` → `fee_categories.id`
- `fee_structures.categoryHeadId` → `category_heads.id`
- `student_fee_structures.studentId` → `students.id`
- `student_fee_structures.feeStructureId` → `fee_structures.id`
- `payments.schoolId` → `schools.id`
- `payments.studentId` → `students.id`
- `payments.feeStructureId` → `fee_structures.id`

### Unique Constraints

- `schools.subdomain` - Unique
- `users.email` - Unique
- `payments.transactionId` - Unique (nullable)
- `(studentId, feeStructureId)` in `student_fee_structures` - Unique combination

---

## Notes

1. **Multi-tenancy**: All fee-related tables include `schoolId` to support multi-school architecture
2. **Soft Deletes**: Consider adding `deletedAt` columns for soft delete functionality
3. **Audit Trail**: `createdAt` and `updatedAt` are automatically managed by TypeORM
4. **JSON Fields**: `applicableMonths` uses JSON array format for flexibility
5. **Decimal Precision**: All monetary amounts use `DECIMAL(10,2)` for accurate financial calculations
6. **Cascading**: Foreign key relationships may need cascade delete rules based on business requirements

---

## Version History

- **v1.2** (Current): 
  - Added `classes` table for class/grade management
  - Made `academicYear` and `dueDate` nullable in `fee_structures`
  - Added `applicableMonths` JSON field to `fee_categories`
- **v1.1**: 
  - Added `categoryHeadId` to `fee_structures` (moved from `fee_categories`)
- **v1.0**: Initial schema with Category Heads, Fee Categories, Fee Structures, and Payments
