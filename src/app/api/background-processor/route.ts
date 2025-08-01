import { NextResponse } from 'next/server';
import { backgroundProcessor } from '@/lib/backgroundProcessor';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        backgroundProcessor.start();
        return NextResponse.json({
          success: true,
          message: 'Background processor started',
          status: 'running'
        });

      case 'stop':
        backgroundProcessor.stop();
        return NextResponse.json({
          success: true,
          message: 'Background processor stopped',
          status: 'stopped'
        });

      case 'status':
        return NextResponse.json({
          success: true,
          status: backgroundProcessor.isActive() ? 'running' : 'stopped'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Background processor control error:', error);
    return NextResponse.json(
      { error: 'Failed to control background processor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return status for GET requests
  return NextResponse.json({
    success: true,
    status: backgroundProcessor.isActive() ? 'running' : 'stopped'
  });
}
