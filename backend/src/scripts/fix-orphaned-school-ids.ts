import dataSource from '../database/data-source';

async function fixOrphanedSchoolIds() {
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Find users with schoolId that don't exist in schools table
    const orphanedUsers = await queryRunner.query(`
      SELECT u.id, u.email, u."schoolId"
      FROM users u
      WHERE u."schoolId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM schools s WHERE s.id = u."schoolId"
      )
    `);

    console.log(`Found ${orphanedUsers.length} users with orphaned schoolId values:`);
    orphanedUsers.forEach((user: any) => {
      console.log(`  - User ID: ${user.id}, Email: ${user.email}, School ID: ${user.schoolId}`);
    });

    if (orphanedUsers.length > 0) {
      // Set orphaned schoolId values to NULL
      await queryRunner.query(`
        UPDATE users
        SET "schoolId" = NULL
        WHERE "schoolId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM schools s WHERE s.id = users."schoolId"
        )
      `);

      console.log(`✅ Fixed ${orphanedUsers.length} orphaned schoolId values (set to NULL)`);
    } else {
      console.log('✅ No orphaned schoolId values found');
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error fixing orphaned schoolIds:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  process.exit(0);
}

fixOrphanedSchoolIds().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
