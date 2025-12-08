// Generation modes
export type GenerationMode = 'translate' | 'enhance' | 'creative';

// Image generation parameters
export interface GenerationParams {
  width: number;
  height: number;
  steps: number;
  cfg: number;
  seed: number;
  sampler?: string;
  scheduler?: string;
  model?: string;
  negativePrompt?: string;
}

// API configuration (from user settings)
export interface ApiConfig {
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmApiFormat?: 'openai' | 'gemini';
  customSystemPrompt?: string;
  comfyuiUrl: string;
  workflowTemplate: string;
}

// API request/response types
export interface GenerateRequest {
  prompt: string;
  mode: GenerationMode;
  params: GenerationParams;
  config: ApiConfig;
}

export interface StatusRequest {
  prompt_id: string;
  comfyuiUrl: string;
}

export interface ImageRequest {
  filename: string;
  comfyuiUrl: string;
}

export interface GenerateResponse {
  prompt_id: string;
  processed_prompt: string;
}

export interface StatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  image_url?: string;
  error?: string;
}

// History item
export interface HistoryItem {
  id: string;
  timestamp: number;
  originalPrompt: string;
  processedPrompt: string;
  mode: GenerationMode;
  params: GenerationParams;
  imageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

// Preset sizes
export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  // SDXL 常用尺寸
  { label: '1:1 方形', width: 1024, height: 1024 },
  { label: '3:2 横向', width: 1216, height: 832 },
  { label: '2:3 纵向', width: 832, height: 1216 },
  { label: '16:9 宽屏', width: 1344, height: 768 },
  { label: '9:16 竖屏', width: 768, height: 1344 },
  // ChatGPT 风格尺寸 (3:2)
  { label: '1:1 小', width: 512, height: 512 },
  { label: '3:2 横向 (ChatGPT)', width: 1536, height: 1024 },
  { label: '2:3 纵向 (ChatGPT)', width: 1024, height: 1536 },
  // 常见屏幕尺寸
  { label: '1080p 横屏', width: 1920, height: 1080 },
  { label: '1080p 竖屏', width: 1080, height: 1920 },
  { label: '2K 横屏', width: 2560, height: 1440 },
  // 社交媒体尺寸
  { label: 'Instagram 方形', width: 1080, height: 1080 },
  { label: 'Instagram 故事', width: 1080, height: 1920 },
  { label: '微信封面', width: 900, height: 500 },
];

// Default values
export const DEFAULTS = {
  steps: 30,
  cfg: 7,
  seed: -1,
  sampler: 'euler',
  scheduler: 'normal',
  negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
};
