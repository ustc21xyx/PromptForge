import { GenerationMode } from '@/types';

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

export async function processPrompt(
  userPrompt: string,
  mode: GenerationMode
): Promise<string> {
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'deepseek-chat';

  if (!apiUrl || !apiKey) {
    throw new Error('LLM API configuration missing');
  }

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[mode] },
        { role: 'user', content: userPrompt },
      ],
      temperature: mode === 'creative' ? 0.9 : 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || userPrompt;
}
