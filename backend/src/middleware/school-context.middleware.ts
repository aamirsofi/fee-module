import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School, SchoolStatus } from '../schools/entities/school.entity';

@Injectable()
export class SchoolContextMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract subdomain from host
    const host = req.get('host') || '';
    let subdomain = this.extractSubdomain(host);

    // For localhost/127.0.0.1, check header or query param (for testing)
    if (['localhost', '127.0.0.1'].includes(host.split(':')[0])) {
      subdomain = req.get('X-School-Subdomain') || (req.query.school as string) || subdomain;
    }

    // Allow super admin to access without school context
    // Note: req.user is set by JWT guard, so it might not be available here
    // We'll handle super admin check in controllers if needed

    if (subdomain) {
      // Find school by subdomain
      const school = await this.schoolRepository.findOne({
        where: {
          subdomain,
          status: SchoolStatus.ACTIVE,
        },
      });

      if (school) {
        req.school = school;
      } else {
        // School not found or inactive
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          req.school = undefined;
        } else {
          return res.status(404).json({
            statusCode: 404,
            message: 'School not found or inactive',
          });
        }
      }
    } else {
      // No subdomain - could be main domain (for super admin or registration)
      req.school = undefined;
    }

    next();
  }

  /**
   * Extract subdomain from host
   * Examples:
   * - school1.example.com -> school1
   * - www.example.com -> null
   * - example.com -> null
   */
  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');

    // If we have at least 3 parts (subdomain.domain.tld) or more
    if (parts.length >= 3) {
      // Skip 'www' if present
      const subdomain = parts[0];
      if (subdomain === 'www') {
        return parts.length >= 4 ? parts[1] : null;
      }
      return subdomain;
    }

    return null;
  }
}
