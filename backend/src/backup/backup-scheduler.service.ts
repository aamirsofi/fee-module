import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { BackupService } from './backup.service';

@Injectable()
export class BackupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BackupSchedulerService.name);
  private scheduledJobName = 'scheduled-backup';

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService,
    private backupService: BackupService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Schedule backup based on settings when module initializes
    // Use setTimeout to avoid blocking module initialization
    setTimeout(async () => {
      try {
        await this.rescheduleBackup();
      } catch (error: any) {
        this.logger.error(`Error initializing backup scheduler: ${error.message}`, error.stack);
      }
    }, 1000); // Wait 1 second for database to be ready
  }

  /**
   * Reschedule backup based on current settings
   * This is called when settings change or on module init
   */
  async rescheduleBackup(): Promise<void> {
    try {
      // Remove existing scheduled job if it exists
      if (this.schedulerRegistry.doesExist('cron', this.scheduledJobName)) {
        this.schedulerRegistry.deleteCronJob(this.scheduledJobName);
        this.logger.log('Removed existing scheduled backup job');
      }

      // Get backup settings
      const settings = await this.settingsService.findByCategory('backup');
      const autoBackupEnabled = settings.autoBackupEnabled === true || settings.autoBackupEnabled === 'true';
      const backupFrequency = settings.backupFrequency || 'daily';

      if (!autoBackupEnabled) {
        this.logger.log('Automatic backups are disabled');
        return;
      }

      // Determine cron expression based on frequency
      const cronExpression = this.getCronExpression(backupFrequency);

      if (!cronExpression) {
        this.logger.warn(`Invalid backup frequency: ${backupFrequency}`);
        return;
      }

      // Create new cron job using the cron from @nestjs/schedule
      const { CronJob } = await import('@nestjs/schedule/node_modules/cron');
      const job = new CronJob(
        cronExpression,
        async () => {
          this.logger.log('Running scheduled backup...');
          try {
            const result = await this.backupService.createBackup();
            if (result.success) {
              this.logger.log(`Scheduled backup completed: ${result.message}`);
            } else {
              this.logger.error(`Scheduled backup failed: ${result.message}`);
            }
          } catch (error: any) {
            this.logger.error(`Error during scheduled backup: ${error.message}`, error.stack);
          }
        },
        null, // onComplete
        true, // start immediately
      );

      this.schedulerRegistry.addCronJob(this.scheduledJobName, job);

      this.logger.log(`Scheduled backup configured: ${backupFrequency} (${cronExpression})`);
    } catch (error: any) {
      this.logger.error(`Error rescheduling backup: ${error.message}`, error.stack);
    }
  }

  /**
   * Get cron expression based on backup frequency
   */
  private getCronExpression(frequency: string): string | null {
    switch (frequency.toLowerCase()) {
      case 'daily':
        // Run daily at 2:00 AM
        return '0 2 * * *';
      case 'weekly':
        // Run weekly on Sunday at 2:00 AM
        return '0 2 * * 0';
      case 'monthly':
        // Run monthly on the 1st day at 2:00 AM
        return '0 2 1 * *';
      case 'hourly':
        // Run every hour at minute 0
        return '0 * * * *';
      default:
        return null;
    }
  }

  /**
   * Get next scheduled backup time
   */
  async getNextBackupTime(): Promise<Date | null> {
    try {
      if (!this.schedulerRegistry.doesExist('cron', this.scheduledJobName)) {
        return null;
      }

      const job = this.schedulerRegistry.getCronJob(this.scheduledJobName);
      const nextDate = job.nextDate();
      
      // nextDate() returns a Date object
      return nextDate instanceof Date ? nextDate : null;
    } catch (error: any) {
      this.logger.error(`Error getting next backup time: ${error.message}`);
      return null;
    }
  }

  /**
   * Get backup schedule status
   */
  async getScheduleStatus(): Promise<{
    enabled: boolean;
    frequency: string;
    nextBackup: Date | null;
  }> {
    try {
      const settings = await this.settingsService.findByCategory('backup');
      const autoBackupEnabled = settings.autoBackupEnabled === true || settings.autoBackupEnabled === 'true';
      const backupFrequency = settings.backupFrequency || 'daily';
      const nextBackup = await this.getNextBackupTime();

      return {
        enabled: autoBackupEnabled,
        frequency: backupFrequency,
        nextBackup,
      };
    } catch (error: any) {
      this.logger.error(`Error getting schedule status: ${error.message}`);
      return {
        enabled: false,
        frequency: 'daily',
        nextBackup: null,
      };
    }
  }
}

