import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { FeeCategoriesModule } from './fee-categories/fee-categories.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';
import { PaymentsModule } from './payments/payments.module';
import { StudentFeeStructuresModule } from './student-fee-structures/student-fee-structures.module';
import { SchoolContextModule } from './middleware/school-context.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { DatabaseConfig } from './database/database.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Rate limiting - Disabled in development, enabled in production
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        limit: process.env.NODE_ENV === 'production' 
          ? parseInt(process.env.THROTTLE_LIMIT || '100')
          : 10000, // Very high limit for development
      },
    ]),

    // Middleware
    SchoolContextModule,

    // Feature modules
    AuthModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    FeeCategoriesModule,
    FeeStructuresModule,
    PaymentsModule,
    StudentFeeStructuresModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Only enable throttling in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // School context middleware is applied in SchoolContextModule
  }
}

