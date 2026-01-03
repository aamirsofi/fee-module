import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FiSettings,
  FiMail,
  FiMessageSquare,
  FiGlobe,
  FiLock,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  settingsService,
  SystemSettings as SystemSettingsType,
} from "@/services/settingsService";

interface SystemSettings {
  // General Settings
  appName: string;
  appUrl: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;

  // Email Settings
  emailEnabled: boolean;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  emailEncryption: string;

  // SMS Settings
  smsEnabled: boolean;
  smsProvider: string;
  smsApiKey: string;
  smsApiSecret: string;
  smsSenderId: string;

  // Security Settings
  sessionTimeout: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
  enableTwoFactor: boolean;
  maxLoginAttempts: number;

  // Notification Settings
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;

  // Backup Settings
  autoBackupEnabled: boolean;
  backupFrequency: string;
  backupRetentionDays: number;
}

export default function SystemSettings() {
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive";
  } | null>(null);

  const showToast = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default"
  ) => {
    setToastMessage({ title, description, variant });
    setTimeout(() => setToastMessage(null), 5000);
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SystemSettings>({
    // General
    appName: "School ERP Platform",
    appUrl: window.location.origin,
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    language: "en",

    // Email
    emailEnabled: false,
    emailProvider: "smtp",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
    emailEncryption: "tls",

    // SMS
    smsEnabled: false,
    smsProvider: "twilio",
    smsApiKey: "",
    smsApiSecret: "",
    smsSenderId: "",

    // Security
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,

    // Notifications
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: true,

    // Backup
    autoBackupEnabled: false,
    backupFrequency: "daily",
    backupRetentionDays: 30,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getAll();
      setSettings((prev) => ({ ...prev, ...data }));
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      showToast(
        "Error",
        error.response?.data?.message || "Failed to load system settings",
        "destructive"
      );
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Map section to category
      const categoryMap: Record<string, string> = {
        general: "general",
        email: "email",
        sms: "sms",
        security: "security",
        backup: "backup",
        all: "all",
      };

      const category = categoryMap[section] || section;

      if (category === "all") {
        await settingsService.updateSettings(settings);
      } else {
        // Get settings for this category only
        const categorySettings: Partial<SystemSettingsType> = {};
        const categoryKeys: Record<string, string[]> = {
          general: [
            "appName",
            "appUrl",
            "timezone",
            "dateFormat",
            "currency",
            "language",
          ],
          email: [
            "emailEnabled",
            "emailProvider",
            "smtpHost",
            "smtpPort",
            "smtpUsername",
            "smtpPassword",
            "smtpFromEmail",
            "smtpFromName",
            "emailEncryption",
          ],
          sms: [
            "smsEnabled",
            "smsProvider",
            "smsApiKey",
            "smsApiSecret",
            "smsSenderId",
          ],
          security: [
            "sessionTimeout",
            "passwordMinLength",
            "requireStrongPassword",
            "enableTwoFactor",
            "maxLoginAttempts",
          ],
          backup: [
            "autoBackupEnabled",
            "backupFrequency",
            "backupRetentionDays",
          ],
        };

        const keys = categoryKeys[category] || [];
        keys.forEach((key) => {
          if (settings[key as keyof SystemSettingsType] !== undefined) {
            categorySettings[key as keyof SystemSettingsType] =
              settings[key as keyof SystemSettingsType];
          }
        });

        await settingsService.updateSettings(categorySettings);
      }

      showToast("Success", `${section} settings saved successfully`);
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      showToast(
        "Error",
        error.response?.data?.message || "Failed to save settings",
        "destructive"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiRefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button onClick={() => handleSave("all")} disabled={saving}>
          {saving ? (
            <>
              <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-2 h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <FiSettings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email">
            <FiMail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <FiMessageSquare className="mr-2 h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="security">
            <FiLock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup">
            <FiGlobe className="mr-2 h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) =>
                      handleInputChange("appName", e.target.value)
                    }
                    placeholder="School ERP Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appUrl">Application URL</Label>
                  <Input
                    id="appUrl"
                    value={settings.appUrl}
                    onChange={(e) =>
                      handleInputChange("appUrl", e.target.value)
                    }
                    placeholder="https://your-domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) =>
                      handleInputChange("timezone", value)
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">
                        Asia/Kolkata (IST)
                      </SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York (EST)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London (GMT)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      handleInputChange("dateFormat", value)
                    }
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) =>
                      handleInputChange("currency", value)
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      handleInputChange("language", value)
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSave("general")} disabled={saving}>
                  <FiSave className="mr-2 h-4 w-4" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email server settings for sending notifications and
                announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailEnabled">Enable Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable email notifications and announcements
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("emailEnabled", checked)
                  }
                />
              </div>

              {settings.emailEnabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emailProvider">Email Provider</Label>
                      <Select
                        value={settings.emailProvider}
                        onValueChange={(value) =>
                          handleInputChange("emailProvider", value)
                        }
                      >
                        <SelectTrigger id="emailProvider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">SMTP</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="ses">AWS SES</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailEncryption">Encryption</Label>
                      <Select
                        value={settings.emailEncryption}
                        onValueChange={(value) =>
                          handleInputChange("emailEncryption", value)
                        }
                      >
                        <SelectTrigger id="emailEncryption">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.smtpHost}
                        onChange={(e) =>
                          handleInputChange("smtpHost", e.target.value)
                        }
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) =>
                          handleInputChange(
                            "smtpPort",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="587"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username</Label>
                      <Input
                        id="smtpUsername"
                        value={settings.smtpUsername}
                        onChange={(e) =>
                          handleInputChange("smtpUsername", e.target.value)
                        }
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) =>
                          handleInputChange("smtpPassword", e.target.value)
                        }
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromEmail">From Email</Label>
                      <Input
                        id="smtpFromEmail"
                        type="email"
                        value={settings.smtpFromEmail}
                        onChange={(e) =>
                          handleInputChange("smtpFromEmail", e.target.value)
                        }
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input
                        id="smtpFromName"
                        value={settings.smtpFromName}
                        onChange={(e) =>
                          handleInputChange("smtpFromName", e.target.value)
                        }
                        placeholder="School ERP Platform"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Test your email settings before saving to ensure they
                        work correctly.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const testEmail = prompt(
                          "Enter email address to test:"
                        );
                        if (testEmail) {
                          try {
                            const result = await settingsService.testEmail({
                              to: testEmail,
                            });
                            if (result.success) {
                              showToast(
                                "Success",
                                "Test email sent successfully!"
                              );
                            } else {
                              showToast("Error", result.message, "destructive");
                            }
                          } catch (error: any) {
                            showToast(
                              "Error",
                              error.response?.data?.message ||
                                "Failed to send test email",
                              "destructive"
                            );
                          }
                        }
                      }}
                    >
                      <FiMail className="mr-2 h-4 w-4" />
                      Test Email
                    </Button>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button onClick={() => handleSave("email")} disabled={saving}>
                  <FiSave className="mr-2 h-4 w-4" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Settings</CardTitle>
              <CardDescription>
                Configure SMS provider settings for sending SMS notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsEnabled">Enable SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable SMS notifications and announcements
                  </p>
                </div>
                <Switch
                  id="smsEnabled"
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("smsEnabled", checked)
                  }
                />
              </div>

              {settings.smsEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smsProvider">SMS Provider</Label>
                    <Select
                      value={settings.smsProvider}
                      onValueChange={(value) =>
                        handleInputChange("smsProvider", value)
                      }
                    >
                      <SelectTrigger id="smsProvider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="aws-sns">AWS SNS</SelectItem>
                        <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                        <SelectItem value="msg91">MSG91</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsSenderId">Sender ID</Label>
                    <Input
                      id="smsSenderId"
                      value={settings.smsSenderId}
                      onChange={(e) =>
                        handleInputChange("smsSenderId", e.target.value)
                      }
                      placeholder="SCHOOL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsApiKey">API Key</Label>
                    <Input
                      id="smsApiKey"
                      type="password"
                      value={settings.smsApiKey}
                      onChange={(e) =>
                        handleInputChange("smsApiKey", e.target.value)
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsApiSecret">API Secret</Label>
                    <Input
                      id="smsApiSecret"
                      type="password"
                      value={settings.smsApiSecret}
                      onChange={(e) =>
                        handleInputChange("smsApiSecret", e.target.value)
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
              {settings.smsEnabled && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Test your SMS settings before saving to ensure they work
                      correctly.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const testPhone = prompt(
                        "Enter phone number to test (E.164 format, e.g., +1234567890):"
                      );
                      if (testPhone) {
                        try {
                          const result = await settingsService.testSms({
                            to: testPhone,
                          });
                          if (result.success) {
                            showToast("Success", "Test SMS sent successfully!");
                          } else {
                            showToast("Error", result.message, "destructive");
                          }
                        } catch (error: any) {
                          showToast(
                            "Error",
                            error.response?.data?.message ||
                              "Failed to send test SMS",
                            "destructive"
                          );
                        }
                      }
                    }}
                  >
                    <FiMessageSquare className="mr-2 h-4 w-4" />
                    Test SMS
                  </Button>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => handleSave("sms")} disabled={saving}>
                  <FiSave className="mr-2 h-4 w-4" />
                  Save SMS Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleInputChange(
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    min={5}
                    max={480}
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) =>
                      handleInputChange(
                        "passwordMinLength",
                        parseInt(e.target.value)
                      )
                    }
                    min={6}
                    max={32}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) =>
                      handleInputChange(
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                    min={3}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Account will be locked after this many failed attempts
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireStrongPassword">
                      Require Strong Password
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require passwords to contain uppercase, lowercase,
                      numbers, and special characters
                    </p>
                  </div>
                  <Switch
                    id="requireStrongPassword"
                    checked={settings.requireStrongPassword}
                    onCheckedChange={(checked) =>
                      handleInputChange("requireStrongPassword", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableTwoFactor">
                      Enable Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to enable 2FA for additional security
                    </p>
                  </div>
                  <Switch
                    id="enableTwoFactor"
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) =>
                      handleInputChange("enableTwoFactor", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave("security")}
                  disabled={saving}
                >
                  <FiSave className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>
                Configure automatic backup settings for your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBackupEnabled">
                    Enable Automatic Backups
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup database at scheduled intervals
                  </p>
                </div>
                <Switch
                  id="autoBackupEnabled"
                  checked={settings.autoBackupEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("autoBackupEnabled", checked)
                  }
                />
              </div>

              {settings.autoBackupEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) =>
                        handleInputChange("backupFrequency", value)
                      }
                    >
                      <SelectTrigger id="backupFrequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupRetentionDays">
                      Retention Period (days)
                    </Label>
                    <Input
                      id="backupRetentionDays"
                      type="number"
                      value={settings.backupRetentionDays}
                      onChange={(e) =>
                        handleInputChange(
                          "backupRetentionDays",
                          parseInt(e.target.value)
                        )
                      }
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground">
                      Backups older than this will be automatically deleted
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Button variant="outline">
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Create Manual Backup
                </Button>
                <p className="text-sm text-muted-foreground">
                  Create an immediate backup of your database
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("backup")} disabled={saving}>
                  <FiSave className="mr-2 h-4 w-4" />
                  Save Backup Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
