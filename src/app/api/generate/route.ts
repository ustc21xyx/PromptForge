import { NextRequest, NextResponse } from 'next/server';
import { processPrompt } from '@/lib/llm';
import { submitToComfyUI } from '@/lib/comfyui';
import { GenerateRequest, DEFAULTS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, mode, params } = body;

    if (!prompt || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and mode' },
        { status: 400 }
      );
    }

    // Step 1: Process prompt with LLM
    const processedPrompt = await processPrompt(prompt, mode);

    // Step 2: Submit to ComfyUI
    const workflowParams = {
      prompt: processedPrompt,
      negativePrompt: params.negativePrompt || DEFAULTS.negativePrompt,
      seed: params.seed ?? DEFAULTS.seed,
      steps: params.steps ?? DEFAULTS.steps,
      cfg: params.cfg ?? DEFAULTS.cfg,
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      sampler: params.sampler || process.env.DEFAULT_SAMPLER || DEFAULTS.sampler,
      scheduler: params.scheduler || process.env.DEFAULT_SCHEDULER || DEFAULTS.scheduler,
      model: params.model || process.env.DEFAULT_MODEL || '',
    };

    if (!workflowParams.model) {
      return NextResponse.json(
        { error: 'Model not specified' },
        { status: 400 }
      );
    }

    const result = await submitToComfyUI(workflowParams);

    return NextResponse.json({
      prompt_id: result.prompt_id,
      processed_prompt: processedPrompt,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
