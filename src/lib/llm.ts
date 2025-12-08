import { GenerationMode } from '@/types';
import { LLMApiFormat } from '@/lib/settings';

const SYSTEM_PROMPTS: Record<GenerationMode, string> = {
  translate: `You are a translator. Translate the user's input into English for Stable Diffusion image generation.
Keep the original meaning, do not add or remove any details.
Output only the translated prompt, nothing else.`,

  enhance: `You are an AI art prompt enhancer. Take the user's input and:
1. Translate it into English if needed
2. Add appropriate details about lighting, composition, style, and atmosphere
3. Keep the user's original intent as the core
4. Output a medium-length prompt suitable for Stable Diffusion

Output only the enhanced prompt, nothing else.`,

  creative: `You are a creative AI art director. Take the user's input as inspiration and:
1. Expand it into a detailed, creative image prompt
2. Add artistic style, mood, scene details, color palette, and visual effects
3. Feel free to interpret and expand creatively
4. Output a rich, detailed prompt for Stable Diffusion

Output only the creative prompt, nothing else.`,
};

export interface LLMConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  apiFormat: LLMApiFormat;
  customSystemPrompt?: string;
}

// Build system prompt with optional custom additions
function buildSystemPrompt(mode: GenerationMode, customPrompt?: string): string {
  let prompt = SYSTEM_PROMPTS[mode];
  if (customPrompt?.trim()) {
    prompt += `\n\n${customPrompt.trim()}`;
  }
  return prompt;
}

// OpenAI-compatible API call
async function callOpenAI(
  userPrompt: string,
  mode: GenerationMode,
  config: LLMConfig
): Promise<string> {
  const { apiUrl, apiKey, model, customSystemPrompt } = config;
  const systemPrompt = buildSystemPrompt(mode, customSystemPrompt);

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: mode === 'creative' ? 0.9 : 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API 错误: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || userPrompt;
}

// Gemini API call
async function callGemini(
  userPrompt: string,
  mode: GenerationMode,
  config: LLMConfig
): Promise<string> {
  const { apiUrl, apiKey, model, customSystemPrompt } = config;
  const systemPrompt = buildSystemPrompt(mode, customSystemPrompt);

  // Gemini API URL format: baseUrl/v1beta/models/{model}:generateContent?key={apiKey}
  // Or if user provides full URL, just append the key
  let url: string;
  if (apiUrl.includes(':generateContent')) {
    url = `${apiUrl}?key=${apiKey}`;
  } else {
    const baseUrl = apiUrl.replace(/\/+$/, '');
    const modelName = model || 'gemini-2.0-flash';
    url = `${baseUrl}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser input: ${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: mode === 'creative' ? 0.9 : 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API 错误: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || userPrompt;
}

export async function processPrompt(
  userPrompt: string,
  mode: GenerationMode,
  config: LLMConfig
): Promise<string> {
  const { apiUrl, apiKey, apiFormat } = config;

  if (!apiUrl || !apiKey) {
    throw new Error('LLM API 配置缺失，请在设置中配置');
  }

  if (apiFormat === 'gemini') {
    return callGemini(userPrompt, mode, config);
  } else {
    return callOpenAI(userPrompt, mode, config);
  }
}
