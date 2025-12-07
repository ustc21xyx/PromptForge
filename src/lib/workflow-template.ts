// ComfyUI Workflow Template
// This template will have placeholders replaced at runtime
export const WORKFLOW_TEMPLATE = {
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
      "text": "<lora:748cmSDXL:0.5> <lora:AIイラストおじさん (2):0.5> <lora:【CRMS】_v0.2:0.5>",
      "model": ["4", 0],
      "clip": ["4", 1]
    },
    "class_type": "Lora Loader (LoraManager)"
  }
};

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

export function buildWorkflow(params: WorkflowParams): object {
  const { prompt, negativePrompt, seed, steps, cfg, width, height, sampler, scheduler, model } = params;

  // Generate random seed if -1
  const actualSeed = seed === -1 ? Math.floor(Math.random() * 1e15) : seed;

  // Convert template to string, replace placeholders, then parse back
  let workflowStr = JSON.stringify(WORKFLOW_TEMPLATE);

  workflowStr = workflowStr
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
