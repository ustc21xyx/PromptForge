import { NextRequest, NextResponse } from 'next/server';
import { fetchComfyUIImage } from '@/lib/comfyui';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const comfyUrl = searchParams.get('url');

    if (!filename) {
      return NextResponse.json(
        { error: '缺少 filename 参数' },
        { status: 400 }
      );
    }

    if (!comfyUrl) {
      return NextResponse.json(
        { error: '缺少 url 参数' },
        { status: 400 }
      );
    }

    // Fetch image from ComfyUI
    const { buffer, contentType } = await fetchComfyUIImage(filename, comfyUrl);

    // Return the image with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
