import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { SchoolsService } from '../schools/schools.service';
import { UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const schoolsService = app.get(SchoolsService);

  // Get or create a school first
  let school;
  const schools = await schoolsService.findAll();
  if (schools.length > 0) {
    school = schools[0];
    console.log(`✅ Using existing school: ${school.name} (ID: ${school.id})`);
  } else {
    console.log('⚠️  No school found. Creating a test school...');
    const adminUser = await usersService.findByEmail('admin@example.com');
    if (!adminUser) {
      console.error('❌ Admin user not found. Please run "npm run create:admin" first.');
      await app.close();
      return;
    }
    school = await schoolsService.create(
      {
        name: 'Test School',
        subdomain: 'test-school',
        email: 'test@school.com',
        phone: '123-456-7890',
        address: '123 Test Street',
        status: 'active' as any,
      },
      adminUser.id,
    );
    console.log(`✅ Created test school: ${school.name} (ID: ${school.id})`);
  }

  // Create test user credentials
  const testEmail = 'test@example.com';
  const testPassword = 'test123';
  const testName = 'Test User';

  try {
    let testUser = await usersService.findByEmail(testEmail);

    if (!testUser) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await usersService.create({
        name: testName,
        email: testEmail,
        password: hashedPassword,
        role: UserRole.ADMINISTRATOR,
        schoolId: school.id,
      });
      console.log('✅ Test user created successfully!');
    } else {
      // Update schoolId if user exists but doesn't have a school
      if (!testUser.schoolId) {
        await usersService.update(testUser.id, { schoolId: school.id });
        console.log('✅ School assigned to existing test user!');
      } else {
        console.log('⚠️  Test user already exists with a school assigned.');
      }
    }

    console.log('\n📋 Test User Credentials:');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`👤 Role: Administrator`);
    console.log(`🏫 School: ${school.name} (ID: ${school.id})`);
    console.log('\n💡 You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

