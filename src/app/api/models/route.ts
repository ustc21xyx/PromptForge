import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { comfyuiUrl } = await request.json();

    if (!comfyuiUrl) {
      return NextResponse.json(
        { error: 'ComfyUI URL 未配置' },
        { status: 400 }
      );
    }

    // Fetch object_info from ComfyUI to get available checkpoints
    const response = await fetch(`${comfyuiUrl}/object_info/CheckpointLoaderSimple`);

    if (!response.ok) {
      throw new Error(`ComfyUI 请求失败: ${response.status}`);
    }

    const data = await response.json();

    // Extract checkpoint names from the response
    const checkpoints: string[] =
      data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];

    return NextResponse.json({ checkpoints });
  } catch (error) {
    console.error('Models fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取模型列表失败' },
      { status: 500 }
    );
  }
}
