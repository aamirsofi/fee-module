import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceFeeGenerationHistory1768000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add fee structure IDs (JSON array)
    await queryRunner.addColumn(
      'fee_generation_history',
      new TableColumn({
        name: 'feeStructureIds',
        type: 'json',
        isNullable: true,
      }),
    );

    // Add class IDs (JSON array)
    await queryRunner.addColumn(
      'fee_generation_history',
      new TableColumn({
        name: 'classIds',
        type: 'json',
        isNullable: true,
      }),
    );

    // Add student IDs (JSON array)
    await queryRunner.addColumn(
      'fee_generation_history',
      new TableColumn({
        name: 'studentIds',
        type: 'json',
        isNullable: true,
      }),
    );

    // Add total amount generated
    await queryRunner.addColumn(
      'fee_generation_history',
      new TableColumn({
        name: 'totalAmountGenerated',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add failed student details (JSON array)
    await queryRunner.addColumn(
      'fee_generation_history',
      new TableColumn({
        name: 'failedStudentDetails',
        type: 'json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('fee_generation_history', 'failedStudentDetails');
    await queryRunner.dropColumn('fee_generation_history', 'totalAmountGenerated');
    await queryRunner.dropColumn('fee_generation_history', 'studentIds');
    await queryRunner.dropColumn('fee_generation_history', 'classIds');
    await queryRunner.dropColumn('fee_generation_history', 'feeStructureIds');
  }
}

