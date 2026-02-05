import { NextRequest, NextResponse } from 'next/server';
import SQLiteClient from '@/lib/sqlite-client';
import { UserSetting, TABLE_NAMES } from '@/lib/db/schema';

/**
 * GET /api/settings
 * 获取用户配置（支持获取单个或全部配置）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    const db = SQLiteClient.getInstance();

    if (key) {
      // 获取单个配置
      const setting = db.queryOne<UserSetting>(
        `SELECT * FROM ${TABLE_NAMES.USER_SETTINGS} WHERE key = ?`,
        [key]
      );

      if (!setting) {
        return NextResponse.json(
          { code: 404, msg: '配置项不存在' },
          { status: 200 }
        );
      }

      // 解析 JSON 值
      let value;
      try {
        value = JSON.parse(setting.value);
      } catch {
        value = setting.value;
      }

      return NextResponse.json({
        code: 0,
        data: {
          key: setting.key,
          value,
          updated_at: setting.updated_at,
        },
      });
    } else {
      // 获取所有配置
      const settings = db.query<UserSetting>(
        `SELECT * FROM ${TABLE_NAMES.USER_SETTINGS} ORDER BY key`
      );

      // 将配置转换为键值对对象
      const data: Record<string, any> = {};
      for (const setting of settings) {
        try {
          data[setting.key] = JSON.parse(setting.value);
        } catch {
          data[setting.key] = setting.value;
        }
      }

      return NextResponse.json({
        code: 0,
        data,
      });
    }
  } catch (error) {
    console.error('获取用户配置失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}

/**
 * PUT /api/settings
 * 更新用户配置（不存在则创建）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    // 验证必填字段
    if (!key) {
      return NextResponse.json(
        { code: 400, msg: 'key is required' },
        { status: 200 }
      );
    }

    if (value === undefined) {
      return NextResponse.json(
        { code: 400, msg: 'value is required' },
        { status: 200 }
      );
    }

    const db = SQLiteClient.getInstance();

    // 将值转换为 JSON 字符串
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // 使用 INSERT OR REPLACE 实现 upsert
    db.run(
      `INSERT OR REPLACE INTO ${TABLE_NAMES.USER_SETTINGS} (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, valueStr, Date.now()]
    );

    return NextResponse.json({
      code: 0,
      msg: '配置更新成功',
    });
  } catch (error) {
    console.error('更新用户配置失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}

/**
 * DELETE /api/settings
 * 删除用户配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    // 验证必填字段
    if (!key) {
      return NextResponse.json(
        { code: 400, msg: 'key is required' },
        { status: 200 }
      );
    }

    const db = SQLiteClient.getInstance();

    // 删除配置
    const result = db.run(
      `DELETE FROM ${TABLE_NAMES.USER_SETTINGS} WHERE key = ?`,
      [key]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { code: 404, msg: '配置项不存在' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      code: 0,
      msg: '配置删除成功',
    });
  } catch (error) {
    console.error('删除用户配置失败:', error);
    return NextResponse.json(
      { code: 500, msg: (error as Error).message || 'Internal server error' },
      { status: 200 }
    );
  }
}
