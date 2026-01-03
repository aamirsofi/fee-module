import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { TestSmsDto } from './dto/test-sms.dto';
import { BackupService } from '../backup/backup.service';
import { BackupSchedulerService } from '../backup/backup-scheduler.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    private backupService: BackupService,
    @Inject(forwardRef(() => BackupSchedulerService))
    private backupSchedulerService?: BackupSchedulerService,
  ) {}

  async findAll(): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find();
    const result: Record<string, any> = {};

    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }

    return result;
  }

  async findByCategory(category: string): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find({
      where: { category },
    });
    const result: Record<string, any> = {};

    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }

    return result;
  }

  async findOne(key: string): Promise<Setting | null> {
    return this.settingsRepository.findOne({ where: { key } });
  }

  async getValue(key: string, defaultValue?: any): Promise<any> {
    const setting = await this.findOne(key);
    if (!setting) {
      return defaultValue;
    }
    return this.parseValue(setting.value, setting.type);
  }

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    const existing = await this.findOne(createSettingDto.key);
    if (existing) {
      throw new BadRequestException(`Setting with key "${createSettingDto.key}" already exists`);
    }

    const setting = this.settingsRepository.create({
      ...createSettingDto,
      value: this.stringifyValue(createSettingDto.value, createSettingDto.type),
    });

    return this.settingsRepository.save(setting);
  }

  async update(key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(key);
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    if (updateSettingDto.value !== undefined) {
      setting.value = this.stringifyValue(
        updateSettingDto.value,
        updateSettingDto.type || setting.type,
      );
    }
    if (updateSettingDto.type) {
      setting.type = updateSettingDto.type;
    }
    if (updateSettingDto.category !== undefined) {
      setting.category = updateSettingDto.category;
    }
    if (updateSettingDto.description !== undefined) {
      setting.description = updateSettingDto.description;
    }

    return this.settingsRepository.save(setting);
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateSettingsDto): Promise<Record<string, any>> {
    const updated: Record<string, any> = {};
    let backupSettingsChanged = false;

    for (const [key, settingData] of Object.entries(bulkUpdateDto.settings)) {
      const value = settingData?.value;
      
      // Check if backup settings are being updated
      if (key === 'autoBackupEnabled' || key === 'backupFrequency') {
        backupSettingsChanged = true;
      }
      
      const setting = await this.findOne(key);
      if (setting) {
        setting.value = this.stringifyValue(value, setting.type);
        await this.settingsRepository.save(setting);
        updated[key] = this.parseValue(setting.value, setting.type);
      } else {
        // Create new setting if it doesn't exist
        // Determine category based on key prefix
        let category: string | null = null;
        if (key.startsWith('app') || key === 'timezone' || key === 'dateFormat' || key === 'currency' || key === 'language') {
          category = 'general';
        } else if (key.includes('email') || key.includes('smtp')) {
          category = 'email';
        } else if (key.includes('sms')) {
          category = 'sms';
        } else if (key.includes('session') || key.includes('password') || key.includes('login') || key.includes('twoFactor')) {
          category = 'security';
        } else if (key.includes('backup')) {
          category = 'backup';
        }

        const newSetting = this.settingsRepository.create({
          key,
          value: this.stringifyValue(value, typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'),
          type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
          category,
        });
        await this.settingsRepository.save(newSetting);
        updated[key] = value;
      }
    }

    // Reschedule backup if backup settings changed
    if (backupSettingsChanged && this.backupSchedulerService) {
      try {
        await this.backupSchedulerService.rescheduleBackup();
        this.logger.log('Backup schedule updated');
      } catch (error: any) {
        this.logger.error(`Error rescheduling backup: ${error.message}`);
      }
    }

    return updated;
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findOne(key);
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    await this.settingsRepository.remove(setting);
  }

  async testEmail(testEmailDto: TestEmailDto): Promise<{ success: boolean; message: string }> {
    try {
      const emailSettings = await this.findByCategory('email');
      
      if (!emailSettings.emailEnabled) {
        throw new BadRequestException('Email is not enabled in settings');
      }

      const transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort || 587,
        secure: emailSettings.emailEncryption === 'ssl',
        auth: {
          user: emailSettings.smtpUsername,
          pass: emailSettings.smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"${emailSettings.smtpFromName || 'School ERP'}" <${emailSettings.smtpFromEmail}>`,
        to: testEmailDto.to,
        subject: testEmailDto.subject || 'Test Email from School ERP',
        text: testEmailDto.message || 'This is a test email from School ERP Platform.',
        html: `<p>${testEmailDto.message || 'This is a test email from School ERP Platform.'}</p>`,
      });

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send test email',
      };
    }
  }

  async testSms(testSmsDto: TestSmsDto): Promise<{ success: boolean; message: string }> {
    try {
      const smsSettings = await this.findByCategory('sms');
      
      if (!smsSettings.smsEnabled) {
        throw new BadRequestException('SMS is not enabled in settings');
      }

      // TODO: Implement actual SMS sending based on provider
      // For now, just validate the settings
      if (!smsSettings.smsApiKey || !smsSettings.smsApiSecret) {
        throw new BadRequestException('SMS API credentials are not configured');
      }

      // Placeholder for actual SMS implementation
      // This would integrate with Twilio, AWS SNS, MSG91, etc.
      console.log('SMS Test:', {
        to: testSmsDto.to,
        message: testSmsDto.message || 'Test SMS from School ERP',
        provider: smsSettings.smsProvider,
      });

      return {
        success: true,
        message: 'SMS test initiated (check logs for details)',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send test SMS',
      };
    }
  }

  async createBackup(): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
    return this.backupService.createBackup();
  }

  async getBackupFilePath(fileName: string): Promise<string | null> {
    return this.backupService.getBackupFilePath(fileName);
  }

  async listBackups(): Promise<Array<{ name: string; size: number; sizeFormatted: string; createdAt: Date }>> {
    return this.backupService.listBackups();
  }

  async getBackupScheduleStatus(): Promise<{
    enabled: boolean;
    frequency: string;
    nextBackup: Date | null;
  }> {
    if (!this.backupSchedulerService) {
      return {
        enabled: false,
        frequency: 'daily',
        nextBackup: null,
      };
    }
    return this.backupSchedulerService.getScheduleStatus();
  }

  private parseValue(value: string | null, type: string): any {
    if (value === null) {
      return null;
    }

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private stringifyValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }
}

