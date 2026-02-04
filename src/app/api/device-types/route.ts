import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AutoPaddleClient from '@/lib/backend-api-client';

/**
 * GET /api/device-types
 * 获取所有设备类型（用于下拉框和字典映射）
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

    // 创建 API 客户端
    const client = new AutoPaddleClient({
      accessToken,
      refreshToken,
      tenantId,
    });

    // 获取所有设备类型（循环分页获取）
    const allTypes: any[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const data = await client.request<any>(
        `/admin-api/device/type/page?pageNo=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
        }
      );

      // 如果返回 401，说明 refresh token 也过期了
      if ((data as any).code === 401) {
        return NextResponse.json(data, { status: 200 });
      }

      const list = data.list || [];
      allTypes.push(...list);

      // 检查是否还有更多数据
      if (list.length < pageSize || allTypes.length >= (data.total || 0)) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // 转换为字典格式
    const typeDict = allTypes.reduce((dict: any, type: any) => {
      dict[type.id] = {
        id: type.id,
        name: type.name,
        type: type.type,
        sorted: type.sorted,
        remark: type.remark,
      };
      return dict;
    }, {});

    return NextResponse.json({
      code: 0,
      data: {
        list: allTypes,
        dict: typeDict,
        total: allTypes.length,
      },
    });
  } catch (error) {
    console.error('获取设备类型失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
