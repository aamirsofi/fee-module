import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSettingsTable1767500000000 implements MigrationInterface {
    name = 'CreateSettingsTable1767500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if settings table already exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'settings'
            )
        `);
        
        if (!tableExists[0].exists) {
            await queryRunner.query(`
                CREATE TABLE "settings" (
                    "id" SERIAL NOT NULL,
                    "key" character varying(100) NOT NULL,
                    "value" text,
                    "type" character varying(50) NOT NULL DEFAULT 'string',
                    "category" character varying(100),
                    "description" text,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "UQ_settings_key" UNIQUE ("key"),
                    CONSTRAINT "PK_settings" PRIMARY KEY ("id")
                )
            `);

            // Insert default settings only if table was just created
            await queryRunner.query(`
                INSERT INTO "settings" ("key", "value", "type", "category", "description") VALUES
                ('appName', 'School ERP Platform', 'string', 'general', 'Application name'),
                ('appUrl', '', 'string', 'general', 'Application URL'),
                ('timezone', 'Asia/Kolkata', 'string', 'general', 'Default timezone'),
                ('dateFormat', 'DD/MM/YYYY', 'string', 'general', 'Date format'),
                ('currency', 'INR', 'string', 'general', 'Default currency'),
                ('language', 'en', 'string', 'general', 'Default language'),
                ('emailEnabled', 'false', 'boolean', 'email', 'Enable email notifications'),
                ('emailProvider', 'smtp', 'string', 'email', 'Email provider'),
                ('smtpHost', '', 'string', 'email', 'SMTP host'),
                ('smtpPort', '587', 'number', 'email', 'SMTP port'),
                ('smtpUsername', '', 'string', 'email', 'SMTP username'),
                ('smtpPassword', '', 'string', 'email', 'SMTP password'),
                ('smtpFromEmail', '', 'string', 'email', 'From email address'),
                ('smtpFromName', 'School ERP Platform', 'string', 'email', 'From name'),
                ('emailEncryption', 'tls', 'string', 'email', 'Email encryption type'),
                ('smsEnabled', 'false', 'boolean', 'sms', 'Enable SMS notifications'),
                ('smsProvider', 'twilio', 'string', 'sms', 'SMS provider'),
                ('smsApiKey', '', 'string', 'sms', 'SMS API key'),
                ('smsApiSecret', '', 'string', 'sms', 'SMS API secret'),
                ('smsSenderId', '', 'string', 'sms', 'SMS sender ID'),
                ('sessionTimeout', '30', 'number', 'security', 'Session timeout in minutes'),
                ('passwordMinLength', '8', 'number', 'security', 'Minimum password length'),
                ('requireStrongPassword', 'true', 'boolean', 'security', 'Require strong password'),
                ('enableTwoFactor', 'false', 'boolean', 'security', 'Enable two-factor authentication'),
                ('maxLoginAttempts', '5', 'number', 'security', 'Maximum login attempts'),
                ('enableEmailNotifications', 'true', 'boolean', 'notifications', 'Enable email notifications'),
                ('enableSmsNotifications', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),
                ('enablePushNotifications', 'true', 'boolean', 'notifications', 'Enable push notifications'),
                ('autoBackupEnabled', 'false', 'boolean', 'backup', 'Enable automatic backups'),
                ('backupFrequency', 'daily', 'string', 'backup', 'Backup frequency'),
                ('backupRetentionDays', '30', 'number', 'backup', 'Backup retention period in days')
            `);
        } else {
            // Table exists, check if default settings need to be inserted
            const settingsCount = await queryRunner.query(`SELECT COUNT(*)::int as count FROM "settings"`);
            if (settingsCount[0].count === 0) {
                // Insert default settings if table is empty
                await queryRunner.query(`
                    INSERT INTO "settings" ("key", "value", "type", "category", "description") VALUES
                    ('appName', 'School ERP Platform', 'string', 'general', 'Application name'),
                    ('appUrl', '', 'string', 'general', 'Application URL'),
                    ('timezone', 'Asia/Kolkata', 'string', 'general', 'Default timezone'),
                    ('dateFormat', 'DD/MM/YYYY', 'string', 'general', 'Date format'),
                    ('currency', 'INR', 'string', 'general', 'Default currency'),
                    ('language', 'en', 'string', 'general', 'Default language'),
                    ('emailEnabled', 'false', 'boolean', 'email', 'Enable email notifications'),
                    ('emailProvider', 'smtp', 'string', 'email', 'Email provider'),
                    ('smtpHost', '', 'string', 'email', 'SMTP host'),
                    ('smtpPort', '587', 'number', 'email', 'SMTP port'),
                    ('smtpUsername', '', 'string', 'email', 'SMTP username'),
                    ('smtpPassword', '', 'string', 'email', 'SMTP password'),
                    ('smtpFromEmail', '', 'string', 'email', 'From email address'),
                    ('smtpFromName', 'School ERP Platform', 'string', 'email', 'From name'),
                    ('emailEncryption', 'tls', 'string', 'email', 'Email encryption type'),
                    ('smsEnabled', 'false', 'boolean', 'sms', 'Enable SMS notifications'),
                    ('smsProvider', 'twilio', 'string', 'sms', 'SMS provider'),
                    ('smsApiKey', '', 'string', 'sms', 'SMS API key'),
                    ('smsApiSecret', '', 'string', 'sms', 'SMS API secret'),
                    ('smsSenderId', '', 'string', 'sms', 'SMS sender ID'),
                    ('sessionTimeout', '30', 'number', 'security', 'Session timeout in minutes'),
                    ('passwordMinLength', '8', 'number', 'security', 'Minimum password length'),
                    ('requireStrongPassword', 'true', 'boolean', 'security', 'Require strong password'),
                    ('enableTwoFactor', 'false', 'boolean', 'security', 'Enable two-factor authentication'),
                    ('maxLoginAttempts', '5', 'number', 'security', 'Maximum login attempts'),
                    ('enableEmailNotifications', 'true', 'boolean', 'notifications', 'Enable email notifications'),
                    ('enableSmsNotifications', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),
                    ('enablePushNotifications', 'true', 'boolean', 'notifications', 'Enable push notifications'),
                    ('autoBackupEnabled', 'false', 'boolean', 'backup', 'Enable automatic backups'),
                    ('backupFrequency', 'daily', 'string', 'backup', 'Backup frequency'),
                    ('backupRetentionDays', '30', 'number', 'backup', 'Backup retention period in days')
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'settings'
            )
        `);
        
        if (tableExists[0].exists) {
            await queryRunner.query(`DROP TABLE "settings"`);
        }
    }
}

