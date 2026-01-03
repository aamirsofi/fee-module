import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { TestSmsDto } from './dto/test-sms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    if (category) {
      return this.settingsService.findByCategory(category);
    }
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Put('bulk')
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(bulkUpdateDto);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(key, updateSettingDto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }

  @Post('test/email')
  testEmail(@Body() testEmailDto: TestEmailDto) {
    return this.settingsService.testEmail(testEmailDto);
  }

  @Post('test/sms')
  testSms(@Body() testSmsDto: TestSmsDto) {
    return this.settingsService.testSms(testSmsDto);
  }
}

