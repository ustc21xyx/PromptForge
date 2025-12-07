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

export async function submitToComfyUI(
  params: WorkflowParams,
  comfyUrl: string,
  workflowTemplate: string
): Promise<ComfyUISubmitResult> {
  if (!comfyUrl) {
    throw new Error('ComfyUI URL 未配置，请在设置中配置');
  }

  if (!workflowTemplate) {
    throw new Error('Workflow 模板未配置，请在设置中配置');
  }

  const workflow = buildWorkflow(workflowTemplate, params);

  const response = await fetch(`${comfyUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ComfyUI 提交错误: ${error}`);
  }

  const data = await response.json();
  return { prompt_id: data.prompt_id };
}

export async function getComfyUIStatus(
  promptId: string,
  comfyUrl: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'error';
  imageFilename?: string;
}> {
  if (!comfyUrl) {
    throw new Error('ComfyUI URL 未配置');
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
      // Look for SaveImage nodes - check common node IDs
      for (const nodeId of Object.keys(historyItem.outputs)) {
        const nodeOutput = historyItem.outputs[nodeId];
        if (nodeOutput?.images?.length) {
          const image = nodeOutput.images[0];
          return {
            status: 'completed',
            imageFilename: image.filename,
          };
        }
      }
    }

    // In history but no output yet = processing
    return { status: 'processing' };
  } catch (error) {
    console.error('Error checking ComfyUI status:', error);
    return { status: 'error' };
  }
}

export async function fetchComfyUIImage(
  filename: string,
  comfyUrl: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  if (!comfyUrl) {
    throw new Error('ComfyUI URL 未配置');
  }

  const imageUrl = `${comfyUrl}/view?filename=${encodeURIComponent(filename)}`;
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('获取图片失败');
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/png';

  return { buffer, contentType };
}
