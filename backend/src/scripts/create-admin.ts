import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import dataSource from '../database/data-source';

async function createAdmin() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    await dataSource.destroy();
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(admin);
  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');

  await dataSource.destroy();
  process.exit(0);
}

createAdmin().catch(error => {
  console.error('Error creating admin:', error);
  process.exit(1);
});
