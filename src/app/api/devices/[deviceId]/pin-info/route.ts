import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AutoPaddleClient from '@/lib/backend-api-client';

/**
 * GET /api/devices/[deviceId]/pin-info
 * 获取设备引脚信息字典（从 AutoPaddle API）
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

    // 创建 AutoPaddle 客户端
    const client = new AutoPaddleClient(accessToken, refreshToken, tenantId);

    // 获取设备的所有引脚信息（分页获取）
    const allPins: any[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await client.request<any>(
        `/admin-api/device/domain-pin/page?deviceDomainId=${deviceId}&pageNo=${page}&pageSize=${pageSize}`,
        { method: 'GET' }
      );

      if (response.code === 0 && response.data) {
        const pins = response.data.list || [];
        allPins.push(...pins);

        // 检查是否还有更多数据
        if (allPins.length >= response.data.total || pins.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    // 构建引脚字典：field -> pin info
    const pinDict: Record<string, any> = {};
    allPins.forEach((pin) => {
      if (pin.field) {
        pinDict[pin.field] = {
          id: pin.id,
          name: pin.name || pin.field,
          alias: pin.alias,
          addr: pin.addr,
          field: pin.field,
          status: pin.status,
          remark: pin.remark,
        };
      }
    });

    return NextResponse.json({
      code: 0,
      data: {
        deviceId,
        pins: allPins,
        dict: pinDict,
        total: allPins.length,
      },
    });
  } catch (error) {
    console.error('获取设备引脚信息失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
