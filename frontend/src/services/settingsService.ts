import api from './api';

export interface SystemSettings {
  // General Settings
  appName?: string;
  appUrl?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  language?: string;
  
  // Email Settings
  emailEnabled?: boolean;
  emailProvider?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  emailEncryption?: string;
  
  // SMS Settings
  smsEnabled?: boolean;
  smsProvider?: string;
  smsApiKey?: string;
  smsApiSecret?: string;
  smsSenderId?: string;
  
  // Security Settings
  sessionTimeout?: number;
  passwordMinLength?: number;
  requireStrongPassword?: boolean;
  enableTwoFactor?: boolean;
  maxLoginAttempts?: number;
  
  // Notification Settings
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;
  
  // Backup Settings
  autoBackupEnabled?: boolean;
  backupFrequency?: string;
  backupRetentionDays?: number;
}

export interface TestEmailDto {
  to: string;
  subject?: string;
  message?: string;
}

export interface TestSmsDto {
  to: string;
  message?: string;
}

export const settingsService = {
  // Get all settings
  getAll: async (category?: string): Promise<SystemSettings> => {
    const params = category ? { category } : {};
    const response = await api.instance.get('/settings', { params });
    return response.data;
  },

  // Get settings by category
  getByCategory: async (category: string): Promise<SystemSettings> => {
    const response = await api.instance.get('/settings', { params: { category } });
    return response.data;
  },

  // Update settings (bulk)
  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    // Transform settings to match backend DTO format: { settings: { key: { value: ... } } }
    const transformedSettings: Record<string, { value: any }> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        transformedSettings[key] = { value };
      }
    });
    
    const response = await api.instance.put('/settings/bulk', { settings: transformedSettings });
    return response.data;
  },

  // Update single setting
  updateSetting: async (key: string, value: any): Promise<any> => {
    const response = await api.instance.put(`/settings/${key}`, { value });
    return response.data;
  },

  // Test email
  testEmail: async (data: TestEmailDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.instance.post('/settings/test/email', data);
    return response.data;
  },

  // Test SMS
  testSms: async (data: TestSmsDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.instance.post('/settings/test/sms', data);
    return response.data;
  },
};

