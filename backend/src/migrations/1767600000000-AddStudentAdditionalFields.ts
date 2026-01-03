import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStudentAdditionalFields1767600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const table = await queryRunner.getTable('students');
    
    if (table) {
      // Route and Transport Information
      if (!table.findColumnByName('routeId')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'routeId',
          type: 'integer',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('routePlanId')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'routePlanId',
          type: 'integer',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('busNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'busNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('busSeatNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'busSeatNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('shift')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'shift',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      // Financial Information
      if (!table.findColumnByName('openingBalance')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'openingBalance',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          default: 0,
        }));
      }

      // Bank Account Information
      if (!table.findColumnByName('bankName')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'bankName',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('branchName')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'branchName',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('bankIfsc')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'bankIfsc',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('bankAccountNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'bankAccountNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      // Additional Information
      if (!table.findColumnByName('penNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'penNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('aadharNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'aadharNumber',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('admissionFormNumber')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'admissionFormNumber',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('whatsappNo')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'whatsappNo',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('categoryHeadId')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'categoryHeadId',
          type: 'integer',
          isNullable: true,
        }));
      }

      if (!table.findColumnByName('isSibling')) {
        await queryRunner.addColumn('students', new TableColumn({
          name: 'isSibling',
          type: 'boolean',
          isNullable: true,
          default: false,
        }));
      }

      // Add foreign key constraints
      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          ADD CONSTRAINT "FK_students_route"
          FOREIGN KEY ("routeId") REFERENCES "routes"("id")
          ON DELETE SET NULL
        `);
      } catch (err) {
        // Foreign key might already exist
      }

      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          ADD CONSTRAINT "FK_students_route_plan"
          FOREIGN KEY ("routePlanId") REFERENCES "route_plans"("id")
          ON DELETE SET NULL
        `);
      } catch (err) {
        // Foreign key might already exist
      }

      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          ADD CONSTRAINT "FK_students_category_head"
          FOREIGN KEY ("categoryHeadId") REFERENCES "category_heads"("id")
          ON DELETE SET NULL
        `);
      } catch (err) {
        // Foreign key might already exist
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('students');
    
    if (table) {
      // Remove foreign key constraints first
      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          DROP CONSTRAINT IF EXISTS "FK_students_category_head"
        `);
      } catch (err) {
        // Ignore errors
      }

      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          DROP CONSTRAINT IF EXISTS "FK_students_route_plan"
        `);
      } catch (err) {
        // Ignore errors
      }

      try {
        await queryRunner.query(`
          ALTER TABLE "students"
          DROP CONSTRAINT IF EXISTS "FK_students_route"
        `);
      } catch (err) {
        // Ignore errors
      }

      // Remove columns
      const columnsToRemove = [
        'isSibling',
        'categoryHeadId',
        'whatsappNo',
        'admissionFormNumber',
        'aadharNumber',
        'penNumber',
        'bankAccountNumber',
        'bankIfsc',
        'branchName',
        'bankName',
        'openingBalance',
        'shift',
        'busSeatNumber',
        'busNumber',
        'routePlanId',
        'routeId',
      ];

      for (const columnName of columnsToRemove) {
        if (table.findColumnByName(columnName)) {
          await queryRunner.dropColumn('students', columnName);
        }
      }
    }
  }
}

