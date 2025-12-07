import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Missing filename parameter' },
        { status: 400 }
      );
    }

    const comfyUrl = process.env.COMFYUI_URL;
    if (!comfyUrl) {
      return NextResponse.json(
        { error: 'ComfyUI URL not configured' },
        { status: 500 }
      );
    }

    // Fetch image from ComfyUI
    const imageUrl = `${comfyUrl}/view?filename=${encodeURIComponent(filename)}`;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from ComfyUI' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
