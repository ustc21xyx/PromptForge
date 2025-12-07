import { NextRequest, NextResponse } from 'next/server';
import { getComfyUIStatus } from '@/lib/comfyui';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('prompt_id');

    if (!promptId) {
      return NextResponse.json(
        { error: 'Missing prompt_id parameter' },
        { status: 400 }
      );
    }

    const result = await getComfyUIStatus(promptId);

    const response: {
      status: string;
      progress?: number;
      image_url?: string;
      error?: string;
    } = {
      status: result.status,
    };

    // Add progress indicator based on status
    if (result.status === 'pending') {
      response.progress = 0;
    } else if (result.status === 'processing') {
      response.progress = 50;
    } else if (result.status === 'completed') {
      response.progress = 100;
      if (result.imageFilename) {
        // Return the proxy URL instead of direct ComfyUI URL
        response.image_url = `/api/image?filename=${encodeURIComponent(result.imageFilename)}`;
      }
    } else if (result.status === 'error') {
      response.error = 'Generation failed';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
