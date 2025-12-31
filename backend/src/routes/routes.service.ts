import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routesRepository: Repository<Route>,
  ) {}

  async create(
    createRouteDto: CreateRouteDto,
    schoolId: number,
  ): Promise<Route> {
    // Check for duplicate name within the same school
    const existing = await this.routesRepository.findOne({
      where: {
        name: createRouteDto.name.trim(),
        schoolId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Route with name "${createRouteDto.name}" already exists for this school`,
      );
    }

    const route = this.routesRepository.create({
      ...createRouteDto,
      name: createRouteDto.name.trim(),
      schoolId,
    });

    return await this.routesRepository.save(route);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, schoolId?: number) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.routesRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.school', 'school');

    if (schoolId) {
      queryBuilder.where('route.schoolId = :schoolId', { schoolId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(route.name ILIKE :search OR route.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('route.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number, schoolId?: number): Promise<Route> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const route = await this.routesRepository.findOne({
      where,
      relations: ['school'],
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(
    id: number,
    updateRouteDto: UpdateRouteDto,
    schoolId?: number,
  ): Promise<Route> {
    const route = await this.findOne(id, schoolId);

    // If name is being updated, check for duplicates
    if (updateRouteDto.name && updateRouteDto.name.trim() !== route.name) {
      const existing = await this.routesRepository.findOne({
        where: {
          name: updateRouteDto.name.trim(),
          schoolId: route.schoolId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Route with name "${updateRouteDto.name}" already exists for this school`,
        );
      }
    }

    Object.assign(route, {
      ...updateRouteDto,
      name: updateRouteDto.name?.trim() || route.name,
    });

    return await this.routesRepository.save(route);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const route = await this.findOne(id, schoolId);
    // TODO: Check if route is being used by any route plans before deleting
    await this.routesRepository.remove(route);
  }
}

