import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/status
 * 检查认证状态
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    const tenantId = cookieStore.get('tenantId')?.value;

    const authenticated = !!(accessToken && refreshToken && tenantId);

    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('检查认证状态失败:', error);
    return NextResponse.json({ authenticated: false });
  }
}
