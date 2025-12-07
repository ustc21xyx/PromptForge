// User settings stored in localStorage

export interface UserSettings {
  // LLM Configuration
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;

  // ComfyUI Configuration
  comfyuiUrl: string;

  // Default generation parameters
  defaultModel: string;  // Checkpoint model
}

const SETTINGS_KEY = 'promptforge_settings';

export const DEFAULT_SETTINGS: UserSettings = {
  llmApiUrl: 'https://api.deepseek.com/v1',
  llmApiKey: '',
  llmModel: 'deepseek-chat',
  comfyuiUrl: '',
  defaultModel: '',
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function isSettingsConfigured(settings: UserSettings): boolean {
  return !!(
    settings.llmApiUrl &&
    settings.llmApiKey &&
    settings.llmModel &&
    settings.comfyuiUrl
  );
}
