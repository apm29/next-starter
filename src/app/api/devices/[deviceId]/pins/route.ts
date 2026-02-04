import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryDevicePinLatestValues } from '@/lib/influxdb-client';

/**
 * GET /api/devices/[deviceId]/pins
 * 获取设备引脚最新值（从 InfluxDB）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;

    // 获取认证信息（验证用户已登录）
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    const tenantId = cookieStore.get('tenantId')?.value;

    // 检查认证
    if (!accessToken || !refreshToken || !tenantId) {
      return NextResponse.json(
        { code: 401, msg: 'Not authenticated' },
        { status: 200 }
      );
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const measurement = searchParams.get('measurement');
    const timeRange = searchParams.get('timeRange') || '-1h';

    if (!measurement) {
      return NextResponse.json(
        { code: 400, msg: 'Missing measurement parameter' },
        { status: 200 }
      );
    }

    // 查询 InfluxDB 获取引脚最新值
    const pinData = await queryDevicePinLatestValues(measurement, timeRange);

    return NextResponse.json({
      code: 0,
      data: {
        deviceId,
        measurement,
        timeRange,
        pins: pinData,
        total: Object.keys(pinData).length,
      },
    });
  } catch (error) {
    console.error('获取设备引脚数据失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
