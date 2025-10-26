import { NextResponse } from 'next/server';
import { getComputerUseStatus, isComputerUseAvailable } from '@/lib/agent/computer-use';

/**
 * GET /api/agent/computer-use/status
 * Check Computer Use availability status
 */
export async function GET() {
  try {
    const status = getComputerUseStatus();
    const available = isComputerUseAvailable();

    return NextResponse.json({
      ...status,
      isAvailable: available,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        available: false,
      },
      { status: 500 }
    );
  }
}
