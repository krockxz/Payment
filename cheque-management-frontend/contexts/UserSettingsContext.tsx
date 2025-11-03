'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface UserSettings {
  email: string;
  name: string;
  phone: string;
  companyName?: string;
  defaultCurrency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  email: '',
  name: '',
  phone: '',
  companyName: '',
  defaultCurrency: 'INR',
  emailNotifications: true,
  smsNotifications: false,
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

interface UserSettingsProviderProps {
  children: ReactNode;
}

export function UserSettingsProvider({ children }: UserSettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to load from localStorage
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }

      // Try to sync with server (optional - for future use)
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const serverSettings = await response.json();
          if (serverSettings.data) {
            setSettings({ ...defaultSettings, ...serverSettings.data });
            // Update localStorage with server data
            localStorage.setItem('userSettings', JSON.stringify(serverSettings.data));
          }
        }
      } catch (serverError) {
        // Server not available, continue with localStorage data
        console.log('Server settings not available, using local settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      toast.error('Failed to load user settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };

      // Validate email if provided
      if (updates.email && !isValidEmail(updates.email)) {
        throw new Error('Invalid email address');
      }

      // Update local state immediately for better UX
      setSettings(newSettings);

      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings));

      // Try to sync with server (optional - for future use)
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          throw new Error('Failed to sync settings with server');
        }
      } catch (serverError) {
        // Server not available, settings are still saved locally
        console.log('Server sync failed, settings saved locally');
      }

      toast.success('Settings updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      toast.error(errorMessage);

      // Revert to previous settings on error
      setSettings(settings);
      throw err;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const value: UserSettingsContextType = {
    settings,
    updateSettings,
    isLoading,
    error,
    refreshSettings,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

// Utility function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}