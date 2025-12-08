// User settings stored in localStorage

export type LLMApiFormat = 'openai' | 'gemini';

export interface UserSettings {
  // LLM Configuration
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmApiFormat: LLMApiFormat;

  // ComfyUI Configuration
  comfyuiUrl: string;
  workflowTemplate: string;  // JSON string of workflow
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
  llmApiUrl: 'https://api.deepseek.com/v1',
  llmApiKey: '',
  llmModel: 'deepseek-chat',
  llmApiFormat: 'openai',
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
  return !!(
    settings.llmApiUrl &&
    settings.llmApiKey &&
    settings.llmModel &&
    settings.comfyuiUrl
  );
}
