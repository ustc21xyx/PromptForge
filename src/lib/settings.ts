// User settings stored in localStorage

export type LLMApiFormat = 'openai' | 'gemini';

export interface LLMProviderSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface UserSettings {
  // Which provider to use
  llmApiFormat: LLMApiFormat;
  // Provider-specific LLM configuration (stored separately)
  openai: LLMProviderSettings;
  gemini: LLMProviderSettings;
  customSystemPrompt: string; // 自定义系统提示词，三种模式共享

  // ComfyUI Configuration
  comfyuiUrl: string;
  workflowTemplate: string; // JSON string of workflow
}

// Generation parameters persistence
export interface GenerationPrefs {
  sizeIndex: number;
  sampler: string;
  scheduler: string;
  steps: number;
  cfg: number;
}

const SETTINGS_KEY = 'promptforge_settings';
const PREFS_KEY = 'promptforge_prefs';

// Default workflow template
export const DEFAULT_WORKFLOW = `{
  "3": {
    "inputs": {
      "seed": "%seed%",
      "steps": "%steps%",
      "cfg": "%scale%",
      "sampler_name": "%sampler%",
      "scheduler": "%scheduler%",
      "denoise": 1,
      "model": ["10", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": { "ckpt_name": "%model%" },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": { "width": "%width%", "height": "%height%", "batch_size": 1 },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": { "text": "%prompt%", "clip": ["10", 1] },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": { "text": "%negative_prompt%", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] },
    "class_type": "SaveImage"
  },
  "10": {
    "inputs": {
      "text": "",
      "model": ["4", 0],
      "clip": ["4", 1]
    },
    "class_type": "Lora Loader (LoraManager)"
  }
}`;

export const DEFAULT_SETTINGS: UserSettings = {
  llmApiFormat: 'openai',
  openai: {
    apiUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
  },
  gemini: {
    apiUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    model: 'gemini-2.0-flash',
  },
  customSystemPrompt: '',
  comfyuiUrl: '',
  workflowTemplate: DEFAULT_WORKFLOW,
};

export const DEFAULT_PREFS: GenerationPrefs = {
  sizeIndex: 0,
  sampler: 'euler',
  scheduler: 'normal',
  steps: 30,
  cfg: 7,
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Partial<UserSettings> & {
        llmApiUrl?: string;
        llmApiKey?: string;
        llmModel?: string;
      };

      // Backward-compat migration from legacy flat fields.
      const migrated: Partial<UserSettings> = { ...parsed };
      const hasLegacy =
        typeof parsed.llmApiUrl === 'string' ||
        typeof parsed.llmApiKey === 'string' ||
        typeof parsed.llmModel === 'string';

      if (hasLegacy) {
        const legacyProvider: LLMApiFormat = parsed.llmApiFormat || 'openai';
        const legacySettings: LLMProviderSettings = {
          apiUrl: parsed.llmApiUrl || DEFAULT_SETTINGS.openai.apiUrl,
          apiKey: parsed.llmApiKey || '',
          model: parsed.llmModel || (legacyProvider === 'gemini' ? DEFAULT_SETTINGS.gemini.model : DEFAULT_SETTINGS.openai.model),
        };

        migrated.openai =
          legacyProvider === 'openai'
            ? legacySettings
            : (parsed.openai as LLMProviderSettings | undefined) || DEFAULT_SETTINGS.openai;
        migrated.gemini =
          legacyProvider === 'gemini'
            ? legacySettings
            : (parsed.gemini as LLMProviderSettings | undefined) || DEFAULT_SETTINGS.gemini;

        delete (migrated as Record<string, unknown>).llmApiUrl;
        delete (migrated as Record<string, unknown>).llmApiKey;
        delete (migrated as Record<string, unknown>).llmModel;
      }

      return {
        ...DEFAULT_SETTINGS,
        ...migrated,
        openai: { ...DEFAULT_SETTINGS.openai, ...(migrated.openai || {}) },
        gemini: { ...DEFAULT_SETTINGS.gemini, ...(migrated.gemini || {}) },
      };
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

export function getPrefs(): GenerationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;

  try {
    const data = localStorage.getItem(PREFS_KEY);
    if (data) {
      return { ...DEFAULT_PREFS, ...JSON.parse(data) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

export function savePrefs(prefs: GenerationPrefs): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save prefs:', error);
  }
}

export function isSettingsConfigured(settings: UserSettings): boolean {
  const provider = settings.llmApiFormat === 'gemini' ? settings.gemini : settings.openai;
  return !!(provider.apiUrl && provider.apiKey && provider.model && settings.comfyuiUrl);
}
