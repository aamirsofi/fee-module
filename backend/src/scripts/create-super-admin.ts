import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import dataSource from '../database/data-source';

async function createSuperAdmin() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  // Check if super admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'su@admin.com' },
  });

  if (existingAdmin) {
    console.log('Super Admin user already exists!');
    console.log('📧 Email: su@admin.com');
    await dataSource.destroy();
    return;
  }

  // Create super admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    name: 'Super Admin',
    email: 'su@admin.com',
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(admin);
  console.log('✅ Super Admin user created successfully!');
  console.log('📧 Email: su@admin.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');

  await dataSource.destroy();
  process.exit(0);
}

createSuperAdmin().catch(error => {
  console.error('Error creating super admin:', error);
  process.exit(1);
});
