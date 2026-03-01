import { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

export interface AlertSetting {
  id: string;
  categoryId: string;
  limit: number;
}

export interface GoalsSetting {
  emergencyTarget: number;
  investmentTarget: number;
}

export interface UserSettings {
  alerts: AlertSetting[];
  goals: GoalsSetting;
}

const DEFAULT_SETTINGS: UserSettings = {
  alerts: [
    { id: 'default-supermercado', categoryId: 'supermercado', limit: 1500 }
  ],
  goals: {
    emergencyTarget: 10000,
    investmentTarget: 5000
  }
};

export function useUserSettings() {
  const { profile } = useAppContext();
  const userId = profile?.id;

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`user_settings_${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({
            alerts: parsed.alerts || DEFAULT_SETTINGS.alerts,
            goals: { ...DEFAULT_SETTINGS.goals, ...parsed.goals }
          });
        } catch (e) {
          console.error('Error parsing settings', e);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, [userId]);

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (userId) {
      localStorage.setItem(`user_settings_${userId}`, JSON.stringify(newSettings));
    }
  };

  return { settings, updateSettings };
}
