import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';

async function assignSchoolToAdmin() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const schoolRepository = dataSource.getRepository(School);

  // Find super admin user
  const admin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    console.log('❌ Admin user not found.');
    await dataSource.destroy();
    process.exit(1);
  }

  // Find first school
  const schools = await schoolRepository.find({
    order: { id: 'ASC' },
    take: 1,
  });

  const school = schools[0];

  if (!school) {
    console.log('❌ No school found. Please run: npm run create:school');
    await dataSource.destroy();
    process.exit(1);
  }

  // Update admin's schoolId
  admin.schoolId = school.id;
  await userRepository.save(admin);

  console.log('✅ School assigned to admin user!');
  console.log(`Admin: ${admin.email}`);
  console.log(`School: ${school.name} (ID: ${school.id})`);

  await dataSource.destroy();
  process.exit(0);
}

assignSchoolToAdmin().catch(error => {
  console.error('Error assigning school:', error);
  process.exit(1);
});
