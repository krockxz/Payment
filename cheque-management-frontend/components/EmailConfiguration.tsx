'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, User, Phone, Building2, CheckCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

export function EmailConfiguration() {
  const { settings, updateSettings, isLoading, error } = useUserSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: settings.email,
    name: settings.name,
    phone: settings.phone,
    companyName: settings.companyName,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditForm({
      email: settings.email,
      name: settings.name,
      phone: settings.phone,
      companyName: settings.companyName,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      email: settings.email,
      name: settings.name,
      phone: settings.phone,
      companyName: settings.companyName,
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(editForm);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsSaving(false);
    }
  };

  const isConfigurationIncomplete = () => {
    return !settings.email || !settings.name || !settings.phone || !settings.companyName;
  };

  const handleNotificationToggle = async (key: 'emailNotifications' | 'smsNotifications') => {
    try {
      await updateSettings({
        [key]: !settings[key]
      });
    } catch (error) {
      // Error is handled by the context
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return editForm.email && validateEmail(editForm.email) && editForm.name.trim();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription>Failed to load settings: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure your default email and contact information for payments and notifications
            </CardDescription>
          </div>
          {settings.email && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Configured
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration Status Alert */}
        {isConfigurationIncomplete() && !isEditing && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuration Incomplete</AlertTitle>
            <AlertDescription>
              Please complete your email configuration to enable payment notifications and receipts.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Configuration Display */}
        {!isEditing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {settings.email || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {settings.name || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {settings.phone || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {settings.companyName || 'Not configured'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive payment confirmations and updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important payment updates via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={() => handleNotificationToggle('smsNotifications')}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleEdit} className="w-full md:w-auto">
              Update Configuration
            </Button>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className={editForm.email && !validateEmail(editForm.email) ? 'border-destructive' : ''}
                />
                {editForm.email && !validateEmail(editForm.email) && (
                  <p className="text-sm text-destructive">Please enter a valid email address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Your Company Ltd."
                  value={editForm.companyName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This email will be used as the default contact for payment receipts and notifications.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!isFormValid() || isSaving}
                className="flex-1 md:flex-auto"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}