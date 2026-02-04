import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/clear
 * 清除认证信息
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    cookieStore.delete('tenantId');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('清除认证信息失败:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
