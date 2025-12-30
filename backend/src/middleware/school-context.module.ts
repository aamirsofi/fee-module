import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolContextMiddleware } from './school-context.middleware';
import { School } from '../schools/entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
})
export class SchoolContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to all routes - middleware handles cases where school context is optional
    consumer.apply(SchoolContextMiddleware).forRoutes('*');
  }
}
