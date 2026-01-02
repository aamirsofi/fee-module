import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchoolIdToStudentAcademicRecords1767259140968 implements MigrationInterface {
    name = 'AddSchoolIdToStudentAcademicRecords1767259140968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add schoolId column as nullable first
        await queryRunner.query(`ALTER TABLE "student_academic_records" ADD "schoolId" integer`);
        
        // Step 2: Populate schoolId for existing records from student, class, or academicYear
        // Try to get from student first (most reliable)
        await queryRunner.query(`
            UPDATE "student_academic_records" sar
            SET "schoolId" = s."schoolId"
            FROM "students" s
            WHERE sar."studentId" = s.id
            AND sar."schoolId" IS NULL
        `);
        
        // If still null, try to get from class
        await queryRunner.query(`
            UPDATE "student_academic_records" sar
            SET "schoolId" = c."schoolId"
            FROM "classes" c
            WHERE sar."classId" = c.id
            AND sar."schoolId" IS NULL
        `);
        
        // If still null, try to get from academicYear
        await queryRunner.query(`
            UPDATE "student_academic_records" sar
            SET "schoolId" = ay."schoolId"
            FROM "academic_years" ay
            WHERE sar."academicYearId" = ay.id
            AND sar."schoolId" IS NULL
        `);
        
        // Step 3: Make schoolId NOT NULL (only if all records have been populated)
        await queryRunner.query(`ALTER TABLE "student_academic_records" ALTER COLUMN "schoolId" SET NOT NULL`);
        
        // Step 4: Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "student_academic_records" ADD CONSTRAINT "FK_ad2e90943611b72a6a76a743c52" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_academic_records" DROP CONSTRAINT "FK_ad2e90943611b72a6a76a743c52"`);
        await queryRunner.query(`ALTER TABLE "student_academic_records" DROP COLUMN "schoolId"`);
    }

}
