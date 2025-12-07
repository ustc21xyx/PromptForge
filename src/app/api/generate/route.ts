import { NextRequest, NextResponse } from 'next/server';
import { processPrompt } from '@/lib/llm';
import { submitToComfyUI } from '@/lib/comfyui';
import { GenerateRequest, DEFAULTS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, mode, params, config } = body;

    if (!prompt || !mode) {
      return NextResponse.json(
        { error: '缺少必填字段: prompt 和 mode' },
        { status: 400 }
      );
    }

    if (!config?.llmApiUrl || !config?.llmApiKey || !config?.comfyuiUrl) {
      return NextResponse.json(
        { error: '请先在设置中配置 LLM API 和 ComfyUI URL' },
        { status: 400 }
      );
    }

    // Step 1: Process prompt with LLM
    const processedPrompt = await processPrompt(prompt, mode, {
      apiUrl: config.llmApiUrl,
      apiKey: config.llmApiKey,
      model: config.llmModel,
    });

    // Step 2: Submit to ComfyUI
    const workflowParams = {
      prompt: processedPrompt,
      negativePrompt: params.negativePrompt || DEFAULTS.negativePrompt,
      seed: params.seed ?? DEFAULTS.seed,
      steps: params.steps ?? DEFAULTS.steps,
      cfg: params.cfg ?? DEFAULTS.cfg,
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      sampler: params.sampler || DEFAULTS.sampler,
      scheduler: params.scheduler || DEFAULTS.scheduler,
      model: params.model || '',
    };

    if (!workflowParams.model) {
      return NextResponse.json(
        { error: '请指定 Checkpoint 模型' },
        { status: 400 }
      );
    }

    const result = await submitToComfyUI(workflowParams, config.comfyuiUrl);

    return NextResponse.json({
      prompt_id: result.prompt_id,
      processed_prompt: processedPrompt,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
