import { NextRequest, NextResponse } from 'next/server';
import { getComfyUIStatus } from '@/lib/comfyui';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt_id, comfyuiUrl } = body;

    if (!prompt_id) {
      return NextResponse.json(
        { error: '缺少 prompt_id 参数' },
        { status: 400 }
      );
    }

    if (!comfyuiUrl) {
      return NextResponse.json(
        { error: '缺少 comfyuiUrl 参数' },
        { status: 400 }
      );
    }

    const result = await getComfyUIStatus(prompt_id, comfyuiUrl);

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
        // Return the proxy URL with filename and comfyuiUrl as query params
        response.image_url = `/api/image?filename=${encodeURIComponent(result.imageFilename)}&url=${encodeURIComponent(comfyuiUrl)}`;
      }
    } else if (result.status === 'error') {
      response.error = '生成失败';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
