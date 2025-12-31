# Student Data Structure Proposal

## Problem Statement

Student information has fields that change every academic year (class, section, fee structures, etc.). We need a structure that:

- Preserves historical data
- Makes current year data easily accessible
- Supports year-over-year reporting
- Handles promotions/transfers

## Proposed Solution: Academic Year-Based Structure

### 1. AcademicYear Entity (NEW)

```typescript
@Entity("academic_years")
export class AcademicYear {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  name!: string; // e.g., "2024-2025"

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;

  @Column({ default: false })
  isCurrent!: boolean; // Only one can be current per school

  @Column()
  schoolId!: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @OneToMany(() => StudentAcademicRecord, (record) => record.academicYear)
  studentRecords!: StudentAcademicRecord[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2. StudentAcademicRecord Entity (NEW)

```typescript
@Entity("student_academic_records")
@Unique(["studentId", "academicYearId"]) // One record per student per year
export class StudentAcademicRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  academicYearId!: number;

  @Column()
  classId!: number; // Linked to Classes entity

  @Column({ nullable: true, length: 50 })
  section?: string; // e.g., "A", "B"

  @Column({ nullable: true, length: 50 })
  rollNumber?: string; // Roll number in that class

  @Column({ nullable: true })
  admissionNumber?: string; // If new admission in this year

  @Column({
    type: "enum",
    enum: AcademicRecordStatus,
    default: AcademicRecordStatus.ACTIVE,
  })
  status!: AcademicRecordStatus; // ACTIVE, PROMOTED, REPEATING, TRANSFERRED, DROPPED

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @ManyToOne(() => Student, (student) => student.academicRecords)
  @JoinColumn({ name: "studentId" })
  student!: Student;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: "academicYearId" })
  academicYear!: AcademicYear;

  @ManyToOne(() => Class)
  @JoinColumn({ name: "classId" })
  class!: Class;

  @OneToMany(() => StudentFeeStructure, (sfs) => sfs.academicRecord)
  feeStructures!: StudentFeeStructure[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

enum AcademicRecordStatus {
  ACTIVE = "active",
  PROMOTED = "promoted",
  REPEATING = "repeating",
  TRANSFERRED = "transferred",
  DROPPED = "dropped",
}
```

### 3. Updated Student Entity

```typescript
@Entity("students")
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  // Permanent Information
  @Column({ length: 255, unique: true })
  studentId!: string; // Permanent student ID (doesn't change)

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255 })
  lastName!: string;

  @Column({ type: "date", nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true, length: 20 })
  gender?: string; // 'male', 'female', 'other'

  @Column({ nullable: true, length: 10 })
  bloodGroup?: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ nullable: true, length: 255 })
  phone?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "date" })
  admissionDate!: Date; // First admission date

  @Column({ nullable: true, length: 255 })
  admissionNumber?: string; // Original admission number

  @Column({ nullable: true, length: 500 })
  photoUrl?: string;

  // Parent/Guardian Information (can be moved to separate table later)
  @Column({ nullable: true, length: 255 })
  parentName?: string;

  @Column({ nullable: true, length: 255 })
  parentEmail?: string;

  @Column({ nullable: true, length: 255 })
  parentPhone?: string;

  @Column({ nullable: true, length: 255 })
  parentRelation?: string; // 'father', 'mother', 'guardian'

  // Overall Status (not year-specific)
  @Column({
    type: "enum",
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status!: StudentStatus; // ACTIVE, INACTIVE, GRADUATED, TRANSFERRED

  @Column()
  schoolId!: number;

  // Relations
  @ManyToOne(() => School, (school) => school.students)
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User;

  @OneToMany(() => StudentAcademicRecord, (record) => record.student)
  academicRecords!: StudentAcademicRecord[];

  @OneToMany(() => Payment, (payment) => payment.student)
  payments!: Payment[];

  // Helper method to get current academic record
  getCurrentAcademicRecord(): StudentAcademicRecord | null {
    return (
      this.academicRecords?.find(
        (record) =>
          record.academicYear.isCurrent &&
          record.status === AcademicRecordStatus.ACTIVE
      ) || null
    );
  }

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 4. Updated StudentFeeStructure Entity

```typescript
@Entity("student_fee_structures")
@Unique(["studentId", "feeStructureId", "academicYearId"])
export class StudentFeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  studentId!: number;

  @Column()
  feeStructureId!: number;

  @Column()
  academicYearId!: number; // NEW: Link to academic year

  @Column({ nullable: true })
  academicRecordId?: number; // NEW: Link to student's academic record for that year

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "date" })
  dueDate!: Date;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @ManyToOne(() => Student, (student) => student.feeStructures)
  @JoinColumn({ name: "studentId" })
  student!: Student;

  @ManyToOne(() => FeeStructure)
  @JoinColumn({ name: "feeStructureId" })
  feeStructure!: FeeStructure;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: "academicYearId" })
  academicYear!: AcademicYear;

  @ManyToOne(() => StudentAcademicRecord, { nullable: true })
  @JoinColumn({ name: "academicRecordId" })
  academicRecord?: StudentAcademicRecord;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

## Benefits of This Structure

1. **Historical Preservation**: All year-specific data is preserved
2. **Easy Current Access**: Query current academic year's record
3. **Promotion Support**: Create new record for new academic year
4. **Reporting**: Generate reports for any academic year
5. **Data Integrity**: Class is properly linked, not a string
6. **Flexibility**: Can add more year-specific fields later

## Migration Strategy

1. Create AcademicYear entity and seed current year
2. Create StudentAcademicRecord entity
3. Migrate existing Student.class to StudentAcademicRecord
4. Update StudentFeeStructure to include academicYearId
5. Update all queries to use current academic year by default
6. Add promotion functionality

## Usage Examples

### Get Student's Current Class

```typescript
const student = await studentService.findOne(id);
const currentRecord = student.getCurrentAcademicRecord();
const currentClass = currentRecord?.class.name; // "10th"
```

### Get Student's Class for Specific Year

```typescript
const record2024 = student.academicRecords.find(
  (r) => r.academicYear.name === "2024-2025"
);
```

### Promote Student to Next Class

```typescript
// Create new academic record for next year
const nextYear = await academicYearService.getNextYear();
const newRecord = await studentAcademicRecordService.create({
  studentId: student.id,
  academicYearId: nextYear.id,
  classId: nextClassId, // e.g., 11th grade
  section: "A",
  status: AcademicRecordStatus.ACTIVE,
});
```

## Next Steps

1. Create AcademicYear module
2. Create StudentAcademicRecord module
3. Update Student entity
4. Update StudentFeeStructure entity
5. Create migration scripts
6. Update frontend to use new structure
