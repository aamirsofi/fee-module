import dataSource from '../database/data-source';
import { School, SchoolStatus } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';

async function createTestSchool() {
  await dataSource.initialize();

  const schoolRepository = dataSource.getRepository(School);
  const userRepository = dataSource.getRepository(User);

  // Find super admin user
  const admin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    console.log('❌ Admin user not found. Please run: npm run create:admin');
    await dataSource.destroy();
    process.exit(1);
  }

  // Check if test school already exists
  const existingSchool = await schoolRepository.findOne({
    where: { subdomain: 'test-school' },
  });

  if (existingSchool) {
    console.log('Test school already exists!');
    console.log(`School ID: ${existingSchool.id}`);
    console.log(`Subdomain: ${existingSchool.subdomain}`);
    await dataSource.destroy();
    return;
  }

  // Create test school
  const school = schoolRepository.create({
    name: 'Test School',
    subdomain: 'test-school',
    email: 'test@school.com',
    phone: '+1234567890',
    address: '123 Test Street',
    status: SchoolStatus.ACTIVE,
    createdById: admin.id,
  });

  await schoolRepository.save(school);
  console.log('✅ Test school created successfully!');
  console.log(`School ID: ${school.id}`);
  console.log(`Name: ${school.name}`);
  console.log(`Subdomain: ${school.subdomain}`);
  console.log('\n💡 To access via subdomain, add to your hosts file:');
  console.log('   127.0.0.1 test-school.localhost');
  console.log('\n   Then access: http://test-school.localhost:5173');

  await dataSource.destroy();
  process.exit(0);
}

createTestSchool().catch(error => {
  console.error('Error creating test school:', error);
  process.exit(1);
});
