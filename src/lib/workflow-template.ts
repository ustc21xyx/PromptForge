// ComfyUI Workflow Template utilities

export interface WorkflowParams {
  prompt: string;
  negativePrompt: string;
  seed: number;
  steps: number;
  cfg: number;
  width: number;
  height: number;
  sampler: string;
  scheduler: string;
  model: string;
}

export function buildWorkflow(templateJson: string, params: WorkflowParams): object {
  const { prompt, negativePrompt, seed, steps, cfg, width, height, sampler, scheduler, model } = params;

  // Generate random seed if -1
  const actualSeed = seed === -1 ? Math.floor(Math.random() * 1e15) : seed;

  // Replace placeholders in template
  const workflowStr = templateJson
    .replace('"%prompt%"', JSON.stringify(prompt))
    .replace('"%negative_prompt%"', JSON.stringify(negativePrompt))
    .replace('"%seed%"', String(actualSeed))
    .replace('"%steps%"', String(steps))
    .replace('"%scale%"', String(cfg))
    .replace('"%width%"', String(width))
    .replace('"%height%"', String(height))
    .replace('"%sampler%"', JSON.stringify(sampler))
    .replace('"%scheduler%"', JSON.stringify(scheduler))
    .replace('"%model%"', JSON.stringify(model));

  return JSON.parse(workflowStr);
}

export function validateWorkflowTemplate(templateJson: string): { valid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(templateJson);
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: '模板必须是 JSON 对象' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `JSON 解析错误: ${e instanceof Error ? e.message : '未知错误'}` };
  }
}
