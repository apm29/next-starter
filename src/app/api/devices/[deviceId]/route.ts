import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AutoPaddleClient from '@/lib/backend-api-client';

/**
 * GET /api/devices/[deviceId]
 * 获取设备详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;

    // 获取认证信息
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

    // 创建 API 客户端
    const client = new AutoPaddleClient({
      accessToken,
      refreshToken,
      tenantId,
    });

    // 调用 AutoPaddle API 获取设备详情
    const data = await client.request<any>(
      `/admin-api/device/domain/get?id=${deviceId}`,
      {
        method: 'GET',
      }
    );

    // 如果返回 401，说明 refresh token 也过期了
    if ((data as any).code === 401) {
      return NextResponse.json(data, { status: 200 });
    }

    // 转换设备数据
    const device = {
      deviceId: data.id,
      deviceName: data.deviceName,
      deviceNo: data.identityCard || data.id,
      status: data.online === 1 ? 'online' : data.online === 0 ? 'offline' : 'unknown',
      deviceType: data.deviceTypeName || (data.deviceTypeId ? `类型 #${data.deviceTypeId}` : '未知类型'),
      deviceTypeId: data.deviceTypeId, // 保留原始 ID
      updateTime: data.dataUploadTime || data.lastHeartbeat || data.createTime,
      ...data, // 保留所有原始数据
    };

    return NextResponse.json({
      code: 0,
      data: device,
    });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
