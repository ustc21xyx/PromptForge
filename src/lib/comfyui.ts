import { buildWorkflow, WorkflowParams } from './workflow-template';

export interface ComfyUISubmitResult {
  prompt_id: string;
}

export interface ComfyUIHistoryResult {
  [promptId: string]: {
    outputs?: {
      [nodeId: string]: {
        images?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
      };
    };
    status?: {
      completed: boolean;
    };
  };
}

export async function submitToComfyUI(params: WorkflowParams): Promise<ComfyUISubmitResult> {
  const comfyUrl = process.env.COMFYUI_URL;

  if (!comfyUrl) {
    throw new Error('ComfyUI URL not configured');
  }

  const workflow = buildWorkflow(params);

  const response = await fetch(`${comfyUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ComfyUI submit error: ${error}`);
  }

  const data = await response.json();
  return { prompt_id: data.prompt_id };
}

export async function getComfyUIStatus(promptId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'error';
  imageFilename?: string;
}> {
  const comfyUrl = process.env.COMFYUI_URL;

  if (!comfyUrl) {
    throw new Error('ComfyUI URL not configured');
  }

  try {
    const response = await fetch(`${comfyUrl}/history/${promptId}`);

    if (!response.ok) {
      throw new Error(`ComfyUI history error: ${response.status}`);
    }

    const data: ComfyUIHistoryResult = await response.json();

    // If prompt_id not in results, still in queue
    if (!data[promptId]) {
      return { status: 'pending' };
    }

    const historyItem = data[promptId];

    // Check if outputs exist and have images
    if (historyItem.outputs) {
      // Look for the SaveImage node (node 9 in our template)
      const saveImageOutput = historyItem.outputs['9'];
      if (saveImageOutput?.images?.length) {
        const image = saveImageOutput.images[0];
        return {
          status: 'completed',
          imageFilename: image.filename,
        };
      }
    }

    // In history but no output yet = processing
    return { status: 'processing' };
  } catch (error) {
    console.error('Error checking ComfyUI status:', error);
    return { status: 'error' };
  }
}

export function getComfyUIImageUrl(filename: string): string {
  const comfyUrl = process.env.COMFYUI_URL;
  return `${comfyUrl}/view?filename=${encodeURIComponent(filename)}`;
}
