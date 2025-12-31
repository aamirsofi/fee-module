import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usersService } from "../services/users.service";
import {
  FiUser,
  FiMail,
  FiLock,
  FiSave,
  FiLoader,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Always check both user object and localStorage to ensure we have the latest data
    let name = "";
    let email = "";

    if (user) {
      name = user.name || "";
      email = user.email || "";
    }

    // Also check localStorage as fallback or if user object doesn't have name
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name && !name) {
          name = parsedUser.name;
        }
        if (parsedUser.email && !email) {
          email = parsedUser.email;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Only update if we have data
    if (name || email) {
      setProfileData({
        name: name,
        email: email,
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedUser = await usersService.updateProfile(user.id, {
        name: profileData.name,
        email: profileData.email,
      });

      // Update auth context with new user data
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUserData = { ...storedUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(updatedUserData));

      // Reload page to update auth context
      window.location.reload();

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await usersService.updatePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setSuccess("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Using shadcn/ui Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            My Profile
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages - Using shadcn/ui Card */}
      {success && (
        <Card className="border-green-400 border-l-4 bg-green-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive border-l-4 bg-destructive/10">
          <CardContent className="p-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Using shadcn/ui Tabs with custom styling */}
      <Card>
        <CardContent className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "profile" | "password");
              setError("");
              setSuccess("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-transparent p-0 h-auto border-b border-gray-200 rounded-none">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 text-sm font-medium transition-all"
              >
                Profile Information
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 text-sm font-medium transition-all"
              >
                Change Password
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      <FiUser className="w-3 h-3 inline mr-1" />
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={profileData.name || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      <FiMail className="w-3 h-3 inline mr-1" />
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Card className="bg-muted">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">
                        Role
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {user.role?.replace("_", " ")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {user.schoolId && (
                  <div className="pt-2">
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-foreground mb-1">
                          School ID
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.schoolId}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-4 mt-0">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    <FiLock className="w-3 h-3 inline mr-1" />
                    Current Password *
                  </label>
                  <Input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    <FiLock className="w-3 h-3 inline mr-1" />
                    New Password *
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    <FiLock className="w-3 h-3 inline mr-1" />
                    Confirm New Password *
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
