# AutoPaddle 示例项目 - AI Agent 指南

## 📋 项目概述

这是一个基于 Next.js 16 的 AutoPaddle 示例项目，集成了 AutoPaddle 云服务和 InfluxDB 时序数据库，用于演示如何接入Autopaddle云服务、InfluxDB、Sqlite。

这个项目是新项目的骨架，不需要兼容旧版API或者数据存储结构；Agent可以删除原有的页面和逻辑重新根据用户的需求生成。

**项目类型**: Next.js Web 应用（App Router）
**主要功能**: 设备列表管理、设备详情查看、实时引脚数据监控
**认证方式**: SSO 单点登录 + Token 自动刷新

## 🛠️ 技术栈

### 核心框架
- **Next.js**: 16.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: ^5

### UI 框架
- **Tailwind CSS**: ^4
- **PostCSS**: ^8.5.0

### 数据集成
- **@influxdata/influxdb-client**: ^1.35.0 - InfluxDB 时序数据库客户端
- **dayjs**: ^1.11.19 - 时间格式化库
- **better-sqlite3**: ^11.8.1 - SQLite 数据库（本地存储）

### 认证
- **SSO 单点登录**: 通过 AutoPaddle 云服务
- **Cookie 存储**: httpOnly cookies 存储认证信息

## 📁 项目结构

```
next-starter/
├── src/
│   ├── app/                          # Next.js App Router 页面
│   │   ├── page.tsx                  # 首页（导航页面）
│   │   ├── devices/                  # 设备管理模块
│   │   │   ├── page.tsx              # 设备列表页面
│   │   │   └── [deviceId]/           # 设备详情页面
│   │   │       └── page.tsx
│   │   └── api/                      # API 路由
│   │       ├── auth/                 # 认证相关 API
│   │       │   ├── status/route.ts   # 检查认证状态
│   │       │   ├── set/route.ts      # 设置认证信息
│   │       │   └── clear/route.ts    # 清除认证信息
│   │       ├── devices/              # 设备相关 API
│   │       │   ├── list/route.ts     # 设备列表
│   │       │   └── [deviceId]/
│   │       │       ├── route.ts      # 设备详情
│   │       │       ├── pins/route.ts # 设备引脚数据（InfluxDB）
│   │       │       └── pin-info/route.ts # 设备引脚信息（AutoPaddle）
│   │       ├── device-types/route.ts # 设备类型字典
│   │       └── settings/             # 用户配置 API（SQLite）
│   │           └── route.ts          # GET (获取), PUT (更新), DELETE (删除)
│   ├── lib/                          # 工具库
│   │   ├── backend-api-client.ts     # 后端 API 客户端（AutoPaddle）
│   │   ├── frontend-api-client.ts    # 前端 API 客户端（Next.js API）
│   │   ├── influxdb-client.ts        # InfluxDB 客户端
│   │   ├── sqlite-client.ts          # SQLite 客户端
│   │   └── db/                       # 数据库相关
│   │       ├── schema.ts             # 数据库 schema 定义
│   │       └── init.ts               # 数据库初始化
│   └── ...
├── data/                             # 数据库文件目录
│   └── app.db                        # SQLite 数据库文件
├── .claude/                          # Claude AI 技能配置
│   └── skills/
│       ├── autopaddle-nextjs-builder/
│       ├── autopaddle-api-explorer/
│       ├── autopaddle-app-pm/
│       └── autopaddle-app-reviewer/
├── package.json
├── tsconfig.json
└── CLAUDE.md                         # 本文件
```
```

## 🔑 核心功能

### 1. 设备列表管理
- **路径**: `/devices`
- **功能**:
  - 分页显示设备列表（20条/页）
  - 搜索设备（按设备名称）
  - 筛选设备（按在线状态）
  - 自动刷新（每10秒）
  - 设备类型名称映射（显示友好名称而非ID）
- **数据源**: AutoPaddle API `/admin-api/device/domain/page`

### 2. 设备详情查看
- **路径**: `/devices/[deviceId]`
- **功能**:
  - 显示设备基本信息（名称、编号、状态、类型、更新时间）
  - 显示实时引脚数据（从 InfluxDB 查询）
  - 引脚名称映射（显示友好名称而非技术字段名）
  - 引脚地址显示
  - 技术信息折叠查看
- **数据源**:
  - 设备信息: AutoPaddle API `/admin-api/device/domain/get`
  - 引脚数据: InfluxDB `queryDevicePinLatestValues()`
  - 引脚信息: AutoPaddle API `/admin-api/device/domain-pin/page`

### 3. 首页导航
- **路径**: `/`
- **功能**:
  - 导航卡片（设备列表、实时监控、告警管理）
  - 功能特性展示
  - 响应式设计

### 4. 本地数据存储（SQLite）
- **用户配置**: 存储用户偏好设置（主题、语言等）
- **数据源**: SQLite 本地数据库 (`data/app.db`)
- **示例用途**: 展示如何在 Next.js 项目中集成 SQLite 数据库

## 🔌 API 集成说明

### AutoPaddle 云服务 API

**基础 URL**: `https://gateway.autopaddle.com`

**认证要求**:
- Header: `Authorization: Bearer ${accessToken}`
- Header: `Tenant-ID: ${tenantId}`

**Token 管理**:
- Access Token: 10分钟有效期
- Refresh Token: 30天有效期
- 自动刷新: 401 响应时自动使用 refresh token 刷新

**关键接口**:
1. **设备列表**: `GET /admin-api/device/domain/page`
   - 参数: pageNo, pageSize, deviceName, online
   - 返回: 分页设备列表

2. **设备详情**: `GET /admin-api/device/domain/get?id={deviceId}`
   - 参数: id (设备ID)
   - 返回: 设备详细信息

3. **设备类型列表**: `GET /admin-api/device/type/page`
   - 参数: pageNo, pageSize
   - 返回: 设备类型列表

4. **设备引脚信息**: `GET /admin-api/device/domain-pin/page`
   - 参数: deviceDomainId, pageNo, pageSize
   - 返回: 设备引脚配置信息（包含名称、别名、地址等）

**其他接口**: 可参考 `autopaddle-api-explorer` skill 查找更多接口

### SQLite 本地数据库

**数据库文件**: `data/app.db`

**数据表**:
1. **user_settings (用户配置)**
   - 字段: key, value, updated_at
   - 用途: 存储用户偏好设置（键值对）

**API 接口**:
1. **用户配置**:
   - `GET /api/settings` - 获取配置（支持单个或全部）
   - `PUT /api/settings` - 更新配置
   - `DELETE /api/settings` - 删除配置

**使用示例**:
```typescript
import SQLiteClient from '@/lib/sqlite-client';
import { TABLE_NAMES } from '@/lib/db/schema';

// 获取数据库实例
const db = SQLiteClient.getInstance();

// 查询配置
const settings = db.query('SELECT * FROM user_settings');

// 插入或更新配置
const result = db.run(
  'INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?, ?, ?)',
  ['theme', '"dark"', Date.now()]
);

// 事务操作
db.transaction(() => {
  db.run('INSERT OR REPLACE INTO user_settings ...');
  db.run('INSERT OR REPLACE INTO user_settings ...');
});
```

### InfluxDB 时序数据库

**连接配置**:
- URL: `http://${GATEWAY_IP}:18086`
- Organization: `autopaddle-org`
- Bucket: `autopaddle-bucket`
- Token: `autopaddle-api-token`

**数据模型**:
- Measurement: `BASE` + 32字符哈希 (例: `BASE00479D607F9B4F8F9204EC0F1F04B177`)
- Field: `{measurement}_{pin_id}` (例: `BASE00479D607F9B4F8F9204EC0F1F04B177_0wFzB7hm`)

**查询示例**:
```flux
from(bucket: "autopaddle-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "BASE00479D607F9B4F8F9204EC0F1F04B177")
  |> last()
```

## 🔐 认证流程

### SSO 单点登录流程

```
1. 用户访问页面
   ↓
2. 前端检查认证状态 (GET /api/auth/status)
   ↓
3. 如果未认证，重定向到 SSO 登录页
   ↓
4. SSO 登录成功，回调返回认证信息
   ↓
5. 前端调用 POST /api/auth/set 设置认证信息
   ↓
6. 后端将认证信息存储到 httpOnly cookies
   ↓
7. 前端重新发起原始请求
   ↓
8. 后端自动附加认证信息调用 AutoPaddle API
```

### Token 自动刷新

```
1. 后端调用 AutoPaddle API
   ↓
2. 收到 401 响应
   ↓
3. 使用 refresh token 调用刷新接口
   ↓
4. 获取新的 access token
   ↓
5. 更新 cookies 中的 access token
   ↓
6. 重新发起原始请求
```

## 📝 开发指南

### 添加新页面

1. 在 `src/app/` 下创建新目录和 `page.tsx`
2. 使用 `NextJsApiClient` 调用后端 API
3. 处理 SSO 回调: `client.handleSSOCallback()`
4. 使用 dayjs 格式化时间
5. 使用 Tailwind CSS 样式

**示例**:
```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import NextJsApiClient from '@/lib/frontend-api-client';
import dayjs from 'dayjs';

export default function NewPage() {
  const [data, setData] = useState(null);
  const client = useMemo(() => new NextJsApiClient(), []);

  useEffect(() => {
    const init = async () => {
      const hasAuth = await client.handleSSOCallback();
      if (!hasAuth) {
        // 已认证，获取数据
        const result = await client.request('/api/your-endpoint');
        setData(result);
      }
    };
    init();
  }, []);

  return (
    <div>
      {/* 页面内容 */}
    </div>
  );
}
```

### 添加新 API 路由

1. 在 `src/app/api/` 下创建新目录和 `route.ts`
2. 使用 `AutoPaddleClient` 调用 AutoPaddle API
3. 从 cookies 获取认证信息
4. 处理错误和 401 响应

**示例**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import AutoPaddleClient from '@/lib/backend-api-client';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    const tenantId = cookieStore.get('tenantId')?.value;

    if (!accessToken || !refreshToken || !tenantId) {
      return NextResponse.json(
        { code: 401, msg: 'Not authenticated' },
        { status: 200 }
      );
    }

    const client = new AutoPaddleClient(accessToken, refreshToken, tenantId);
    const data = await client.request('/admin-api/your-endpoint');

    return NextResponse.json({ code: 0, data });
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: (error as Error).message },
      { status: 200 }
    );
  }
}
```

### 使用 SQLite 数据库

1. 导入 SQLite 客户端和 schema
2. 获取数据库实例（单例模式）
3. 使用 query/queryOne/run 方法操作数据
4. 遵循项目统一的响应格式

**示例**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import SQLiteClient from '@/lib/sqlite-client';
import { TABLE_NAMES, UserSetting } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const db = SQLiteClient.getInstance();

    // 查询所有配置
    const settings = db.query<UserSetting>(
      `SELECT * FROM ${TABLE_NAMES.USER_SETTINGS}`
    );

    // 转换为键值对对象
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
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: (error as Error).message },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    const db = SQLiteClient.getInstance();

    // 将值转换为 JSON 字符串
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // 插入或更新配置
    db.run(
      `INSERT OR REPLACE INTO ${TABLE_NAMES.USER_SETTINGS} (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, valueStr, Date.now()]
    );

    return NextResponse.json({
      code: 0,
      msg: '配置更新成功',
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: (error as Error).message },
      { status: 200 }
    );
  }
}
```

### 查询 InfluxDB 数据

1. 使用 `src/lib/influxdb-client.ts` 中的函数
2. 需要知道 measurement 名称（从设备详情 API 获取）
3. 使用 Flux 查询语言

**示例**:
```typescript
import { queryDevicePinLatestValues } from '@/lib/influxdb-client';

// 查询设备引脚最新值
const pinData = await queryDevicePinLatestValues(
  'BASE00479D607F9B4F8F9204EC0F1F04B177',
  '-1h'
);

// 返回格式: { field: { value, time }, ... }
```

## 🎯 常见任务

### 任务 1: 添加新的设备筛选条件

1. 更新 `src/app/devices/page.tsx`:
   - 添加新的 state: `const [newFilter, setNewFilter] = useState('')`
   - 添加筛选 UI 组件
   - 更新 `fetchDevices()` 函数，添加新参数

2. 更新 `src/app/api/devices/list/route.ts`:
   - 从 searchParams 获取新参数
   - 传递给 AutoPaddle API

### 任务 2: 添加设备操作功能（编辑、删除等）

1. 查找对应的 AutoPaddle API（使用 `autopaddle-api-explorer` skill）
2. 创建新的 API 路由: `src/app/api/devices/[deviceId]/update/route.ts`
3. 在设备详情页面添加操作按钮
4. 调用新的 API 路由

### 任务 3: 添加图表展示引脚历史数据

1. 安装图表库: `npm install recharts` 或 `npm install chart.js react-chartjs-2`
2. 使用 `queryDevicePinHistory()` 查询历史数据
3. 在设备详情页面添加图表组件
4. 配置图表显示时间序列数据

### 任务 4: 添加实时数据自动刷新

1. 使用 `setInterval` 定时刷新
2. 在组件卸载时清理定时器
3. 添加刷新状态指示器

**示例**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 10000); // 每10秒刷新

  return () => clearInterval(interval);
}, []);
```

### 任务 5: 扩展 SQLite 数据库（添加新表）

**示例**: 添加 `favorites` 表存储收藏的设备

1. 在 `src/lib/db/schema.ts` 添加新表定义:
   ```typescript
   export interface Favorite {
     id: number;
     device_id: string;
     device_name: string | null;
     created_at: number;
   }

   export const CREATE_FAVORITES_TABLE = `
     CREATE TABLE IF NOT EXISTS favorites (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       device_id TEXT NOT NULL,
       device_name TEXT,
       created_at INTEGER NOT NULL,
       UNIQUE(device_id)
     )
   `;
   ```

2. 在 `src/lib/db/schema.ts` 的 `ALL_CREATE_STATEMENTS` 数组中添加新表:
   ```typescript
   export const ALL_CREATE_STATEMENTS = [
     CREATE_USER_SETTINGS_TABLE,
     CREATE_FAVORITES_TABLE, // 新增
   ];
   ```

3. 创建对应的 API 路由 `src/app/api/favorites/route.ts`

4. 使用 SQLiteClient 操作新表

**注意**: 添加新表后需要删除旧的数据库文件 `data/app.db`，重启服务器会自动创建包含新表的数据库。

## ⚠️ 重要注意事项

### 1. 认证信息安全
- ✅ **正确**: 认证信息存储在后端 httpOnly cookies
- ❌ **错误**: 不要在前端 localStorage 或 state 中存储 token
- ❌ **错误**: 不要在前端直接调用 AutoPaddle API

### 2. ID 显示规范
- ✅ **正确**: 显示友好名称（设备名称、引脚名称）
- ❌ **错误**: 直接显示 ID 数字
- ✅ **正确**: 使用字典映射 ID 到名称
- ✅ **正确**: 提供三层降级: `alias || name || id`

### 3. 时间格式化
- ✅ **正确**: 使用 dayjs 格式化时间
- ❌ **错误**: 显示原始 ISO 时间戳
- ✅ **推荐格式**: `YYYY-MM-DD HH:mm:ss` 或 `fromNow()`

### 4. 数据完整性
- ✅ **正确**: 使用分页循环获取所有数据（下拉框、字典）
- ❌ **错误**: 只获取第一页数据
- ✅ **正确**: 检查 `total` 字段判断是否还有更多数据

### 5. 错误处理
- ✅ **正确**: 捕获所有异步错误
- ✅ **正确**: 显示友好的错误消息
- ✅ **正确**: 提供重试机制
- ✅ **正确**: 非关键数据失败不影响页面显示

### 6. InfluxDB 查询
- ✅ **正确**: 使用 `autopaddle-org` 作为 organization
- ❌ **错误**: 不要使用 `autopaddle`（旧配置）
- ✅ **正确**: 从设备详情 API 获取 measurement 名称
- ✅ **正确**: 从引脚信息 API 获取 field 名称

### 7. SQLite 数据库使用
- ✅ **正确**: 使用 `SQLiteClient.getInstance()` 获取单例实例
- ✅ **正确**: 使用参数化查询防止 SQL 注入
- ✅ **正确**: 数据库文件存放在 `data/app.db`
- ✅ **正确**: 使用事务处理多个相关操作
- ❌ **错误**: 不要在前端直接操作 SQLite（仅在 API 路由中使用）
- ✅ **正确**: 遵循项目统一的响应格式 `{ code, data, msg }`

## 📚 相关技能 (Claude Skills)

### autopaddle-nextjs-builder
- **用途**: 构建 AutoPaddle Next.js 应用
- **何时使用**: 添加新功能、新页面、新 API 路由

### autopaddle-api-explorer
- **用途**: 查找 AutoPaddle API 接口
- **何时使用**: 需要调用新的 AutoPaddle API 时

### autopaddle-app-pm
- **用途**: 需求分析和规划
- **何时使用**: 开始新功能开发前，明确需求

### autopaddle-app-reviewer
- **用途**: 代码质量审查
- **何时使用**: 功能开发完成后，检查 UX 合规性

## 🚀 快速命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 安装依赖
npm install
```

## 📞 环境变量

项目运行时需要以下环境变量（由父进程提供）:

```bash
PORT=3000                          # 服务器端口
GATEWAY_IP=localhost               # 网关 IP 地址
GATEWAY_APP_ID=your-app-id         # 应用 ID
GATEWAY_APP_SECRET=your-secret     # 应用密钥

# 可选（如果已有认证信息）
REFRESH_TOKEN=xxx                  # Refresh Token
ACCESS_TOKEN=xxx                   # Access Token
TENANT_ID=xxx                      # 租户 ID
```

## 📖 参考文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [InfluxDB 客户端文档](https://github.com/influxdata/influxdb-client-js)
- [dayjs 文档](https://day.js.org/docs/en/installation/installation)

---

**最后更新**: 2026-02-04
**项目版本**: 0.1.0
**维护者**: AutoPaddle Team
