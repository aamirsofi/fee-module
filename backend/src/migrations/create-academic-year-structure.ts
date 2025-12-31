/**
 * Migration script to create Academic Year structure
 * 
 * This migration:
 * 1. Creates academic_years table
 * 2. Creates student_academic_records table
 * 3. Migrates existing student class/section data to student_academic_records
 * 4. Adds academicYearId to student_fee_structures
 * 5. Removes class and section columns from students table (after migration)
 * 
 * Run this after creating the entities but before removing class/section from Student entity
 */

import { DataSource } from 'typeorm';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { StudentAcademicRecord } from '../student-academic-records/entities/student-academic-record.entity';
import { Student } from '../students/entities/student.entity';
import { Class } from '../classes/entities/class.entity';

export async function migrateToAcademicYearStructure(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Starting Academic Year Structure Migration...');

    // Step 1: Create academic_years table if not exists
    console.log('Step 1: Creating academic_years table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        "isCurrent" BOOLEAN DEFAULT false,
        description TEXT,
        "schoolId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_academic_years_school_name" UNIQUE ("schoolId", name),
        CONSTRAINT "FK_academic_years_school" FOREIGN KEY ("schoolId") REFERENCES schools(id) ON DELETE CASCADE
      );
    `);

    // Step 2: Create student_academic_records table if not exists
    console.log('Step 2: Creating student_academic_records table...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_academic_records (
        id SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL,
        "academicYearId" INTEGER NOT NULL,
        "classId" INTEGER NOT NULL,
        section VARCHAR(50),
        "rollNumber" VARCHAR(50),
        "admissionNumber" VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        remarks TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_student_academic_records" UNIQUE ("studentId", "academicYearId"),
        CONSTRAINT "FK_student_academic_records_student" FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT "FK_student_academic_records_academic_year" FOREIGN KEY ("academicYearId") REFERENCES academic_years(id) ON DELETE CASCADE,
        CONSTRAINT "FK_student_academic_records_class" FOREIGN KEY ("classId") REFERENCES classes(id) ON DELETE RESTRICT
      );
    `);

    // Step 3: Add academicYearId and academicRecordId to student_fee_structures if not exists
    console.log('Step 3: Adding academicYearId to student_fee_structures...');
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'student_fee_structures' AND column_name = 'academicYearId'
        ) THEN
          ALTER TABLE student_fee_structures 
          ADD COLUMN "academicYearId" INTEGER,
          ADD COLUMN "academicRecordId" INTEGER,
          ADD CONSTRAINT "FK_student_fee_structures_academic_year" 
            FOREIGN KEY ("academicYearId") REFERENCES academic_years(id) ON DELETE CASCADE,
          ADD CONSTRAINT "FK_student_fee_structures_academic_record" 
            FOREIGN KEY ("academicRecordId") REFERENCES student_academic_records(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Step 4: Create default academic year for each school (if not exists)
    console.log('Step 4: Creating default academic years for schools...');
    const schools = await queryRunner.query(`SELECT id FROM schools WHERE status = 'active'`);
    
    for (const school of schools) {
      const currentYear = new Date().getFullYear();
      const month = new Date().getMonth();
      
      // Determine academic year based on current date
      let startYear: number;
      let endYear: number;
      
      if (month < 3) {
        // Jan-Mar: Previous year to current year
        startYear = currentYear - 1;
        endYear = currentYear;
      } else {
        // Apr-Dec: Current year to next year
        startYear = currentYear;
        endYear = currentYear + 1;
      }
      
      const yearName = `${startYear}-${endYear}`;
      const startDate = `${startYear}-04-01`;
      const endDate = `${endYear}-03-31`;
      
      // Check if academic year already exists
      const existing = await queryRunner.query(
        `SELECT id FROM academic_years WHERE "schoolId" = $1 AND name = $2`,
        [school.id, yearName]
      );
      
      if (existing.length === 0) {
        // Unset other current years for this school
        await queryRunner.query(
          `UPDATE academic_years SET "isCurrent" = false WHERE "schoolId" = $1`,
          [school.id]
        );
        
        // Create new academic year
        await queryRunner.query(
          `INSERT INTO academic_years (name, "startDate", "endDate", "isCurrent", "schoolId")
           VALUES ($1, $2, $3, true, $4)`,
          [yearName, startDate, endDate, school.id]
        );
        console.log(`  Created academic year ${yearName} for school ${school.id}`);
      }
    }

    // Step 5: Migrate existing student class/section data to student_academic_records
    console.log('Step 5: Migrating existing student data...');
    
    // Get all students with class information
    const students = await queryRunner.query(`
      SELECT s.id, s."schoolId", s.class, s.section, s."admissionDate"
      FROM students s
      WHERE s.class IS NOT NULL AND s.class != ''
    `);
    
    for (const student of students) {
      // Get current academic year for this school
      const academicYear = await queryRunner.query(
        `SELECT id FROM academic_years WHERE "schoolId" = $1 AND "isCurrent" = true LIMIT 1`,
        [student.schoolId]
      );
      
      if (academicYear.length === 0) {
        console.log(`  Warning: No current academic year found for school ${student.schoolId}, skipping student ${student.id}`);
        continue;
      }
      
      const academicYearId = academicYear[0].id;
      
      // Try to find class by name
      const classRecord = await queryRunner.query(
        `SELECT id FROM classes WHERE name = $1 AND "schoolId" = $2 LIMIT 1`,
        [student.class, student.schoolId]
      );
      
      if (classRecord.length === 0) {
        console.log(`  Warning: Class "${student.class}" not found for school ${student.schoolId}, skipping student ${student.id}`);
        continue;
      }
      
      const classId = classRecord[0].id;
      
      // Check if record already exists
      const existingRecord = await queryRunner.query(
        `SELECT id FROM student_academic_records WHERE "studentId" = $1 AND "academicYearId" = $2`,
        [student.id, academicYearId]
      );
      
      if (existingRecord.length === 0) {
        await queryRunner.query(
          `INSERT INTO student_academic_records 
           ("studentId", "academicYearId", "classId", section, status, "admissionNumber")
           VALUES ($1, $2, $3, $4, 'active', $5)`,
          [student.id, academicYearId, classId, student.section || null, student.admissionNumber || null]
        );
        console.log(`  Migrated student ${student.id} to academic record`);
      }
    }

    // Step 6: Update student_fee_structures with academicYearId
    console.log('Step 6: Updating student_fee_structures with academicYearId...');
    await queryRunner.query(`
      UPDATE student_fee_structures sfs
      SET "academicYearId" = (
        SELECT sar."academicYearId"
        FROM student_academic_records sar
        WHERE sar."studentId" = sfs."studentId"
        AND sar.status = 'active'
        LIMIT 1
      )
      WHERE sfs."academicYearId" IS NULL;
    `);

    await queryRunner.commitTransaction();
    console.log('✅ Migration completed successfully!');
    
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Remove class and section columns from students table manually:');
    console.log('   ALTER TABLE students DROP COLUMN IF EXISTS class;');
    console.log('   ALTER TABLE students DROP COLUMN IF EXISTS section;');
    console.log('2. Update unique constraint on student_fee_structures:');
    console.log('   DROP INDEX IF EXISTS "UQ_student_fee_structures_student_fee";');
    console.log('   CREATE UNIQUE INDEX "UQ_student_fee_structures_student_fee_year" ON student_fee_structures("studentId", "feeStructureId", "academicYearId");');
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

