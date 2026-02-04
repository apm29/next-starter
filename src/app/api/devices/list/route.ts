import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AutoPaddleClient from '@/lib/backend-api-client';

/**
 * GET /api/devices/list
 * 获取设备列表（支持分页、搜索、筛选）
 */
export async function GET(request: NextRequest) {
  try {
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // 创建 API 客户端
    const client = new AutoPaddleClient({
      accessToken,
      refreshToken,
      tenantId,
    });

    // 构建查询参数
    const queryParams = new URLSearchParams({
      pageNo: page.toString(),
      pageSize: pageSize.toString(),
    });

    // 添加搜索参数（设备名称）
    if (search) {
      queryParams.append('deviceName', search);
    }

    // 添加状态筛选（在线状态）
    if (status && status !== 'all') {
      // 状态映射：online=1, offline=0
      const onlineStatus = status === 'online' ? '1' : status === 'offline' ? '0' : '';
      if (onlineStatus) {
        queryParams.append('online', onlineStatus);
      }
    }

    // 调用 AutoPaddle API 获取设备列表
    const data = await client.request<any>(
      `/admin-api/device/domain/page?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );

    // 如果返回 401，说明 refresh token 也过期了
    if ((data as any).code === 401) {
      return NextResponse.json(data, { status: 200 });
    }

    // API 返回的数据结构：{ list: [...], total: number }
    const devices = data.list || [];
    const total = data.total || 0;

    // 转换设备数据，添加状态映射
    const transformedDevices = devices.map((device: any) => ({
      deviceId: device.id,
      deviceName: device.deviceName,
      deviceNo: device.identityCard || device.id, // 使用身份证卡或ID作为设备编号
      status: device.online === 1 ? 'online' : device.online === 0 ? 'offline' : 'unknown',
      deviceTypeId: device.deviceTypeId, // 保留原始 ID
      updateTime: device.dataUploadTime || device.lastHeartbeat || device.createTime,
      ...device, // 保留所有原始数据
    }));

    return NextResponse.json({
      code: 0,
      data: {
        list: transformedDevices,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
