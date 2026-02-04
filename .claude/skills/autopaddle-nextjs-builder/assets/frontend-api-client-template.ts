/**
 * Next.js API 客户端 - 前端认证流程
 *
 * 调用流程：
 * 1. 直接调用 Next.js 后端接口
 * 2. 返回 401 code 时进行跳转授权
 * 3. 获取认证信息调用 Next.js 后端的更新授权接口
 * 4. 重新发起刚才的调用
 * 5. 第一步成功的话直接返回结果
 */

// ============================================
// 类型定义
// ============================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  data?: T;
}

interface AuthInfo {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
}

interface PendingRequest {
  endpoint: string;
  options: RequestOptions;
}

interface AuthStatusResponse {
  authenticated: boolean;
}

interface AuthSetResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Next.js API 客户端
// ============================================

class NextJsApiClient {
  private baseUrl: string;
  private authBaseUrl: string;
  private ssoBaseUrl: string;

  constructor(baseUrl: string = '/api/') {
    this.baseUrl = baseUrl;
    this.authBaseUrl = '/api/auth';
    this.ssoBaseUrl = 'https://gateway.autopaddle.com';
  }

  /**
   * 调用 Next.js 后端 API
   * @param endpoint - API 端点
   * @param options - 请求选项
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T | null> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // 1. 直接调用 Next.js 后端接口
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();

      // 5. 第一步成功的话直接返回结果
      if (data.code === 0 || data.code === undefined) {
        return data.data || (data as any);
      }

      // 2. 返回 401 code 时进行跳转授权
      if (data.code === 401) {
        console.log('🔐 需要授权，跳转到 SSO 登录页');
        await this.handleAuthFlow(endpoint, options);
        return null; // 授权流程会重定向，不会执行到这里
      }

      // 其他错误
      throw new Error(data.msg || 'API request failed');
    } catch (error) {
      console.error('❌ API 请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理授权流程
   * @param originalEndpoint - 原始请求的端点
   * @param originalOptions - 原始请求的选项
   */
  private async handleAuthFlow(originalEndpoint: string, originalOptions: RequestOptions): Promise<void> {
    // 保存原始请求信息到 sessionStorage，授权后恢复
    const pendingRequest: PendingRequest = {
      endpoint: originalEndpoint,
      options: originalOptions,
    };
    sessionStorage.setItem('pendingRequest', JSON.stringify(pendingRequest));

    // 跳转到 SSO 授权页
    const currentUrl = window.location.href;
    const loginUrl = `${this.ssoBaseUrl}/#/sso/authorize?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = loginUrl;
  }

  /**
   * 3. 设置认证信息到后端
   * @param accessToken - 访问令牌
   * @param refreshToken - 刷新令牌
   * @param tenantId - 租户ID
   */
  async setAuthInfo(accessToken: string, refreshToken: string, tenantId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.authBaseUrl}/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          tenantId,
        }),
      });

      const data: AuthSetResponse = await response.json();

      if (data.success) {
        console.log('✅ 认证信息已设置到后端');
        return true;
      } else {
        console.error('❌ 设置认证信息失败:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 设置认证信息失败:', error);
      return false;
    }
  }

  /**
   * 处理 SSO 回调
   * 从 URL 参数获取认证信息，设置到后端，然后重新发起之前的请求
   */
  async handleSSOCallback<T = any>(): Promise<T | boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const tenantId = urlParams.get('tenantId');

    if (accessToken && refreshToken && tenantId) {
      console.log('🔐 检测到 SSO 认证信息');

      // 3. 获取认证信息调用 Next.js 后端的更新授权接口
      const success = await this.setAuthInfo(accessToken, refreshToken, tenantId);

      if (success) {
        // 清除 URL 参数（安全考虑）
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // 4. 重新发起刚才的调用
        const pendingRequestStr = sessionStorage.getItem('pendingRequest');
        if (pendingRequestStr) {
          const pendingRequest: PendingRequest = JSON.parse(pendingRequestStr);
          sessionStorage.removeItem('pendingRequest');

          console.log('🔄 重新发起之前的请求:', pendingRequest.endpoint);
          return await this.request<T>(pendingRequest.endpoint, pendingRequest.options) as T;
        }

        return true;
      } else {
        console.error('❌ 设置认证信息失败，重新跳转授权');
        await this.handleAuthFlow('', {});
      }
    }

    return false;
  }

  /**
   * 检查是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch(`${this.authBaseUrl}/status`);
      const data: AuthStatusResponse = await response.json();
      return data.authenticated === true;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 清除认证信息
   */
  async clearAuth(): Promise<void> {
    try {
      await fetch(`${this.authBaseUrl}/clear`, { method: 'POST' });
      console.log('🗑️ 已清除后端认证信息');
    } catch (error) {
      console.error('清除认证信息失败:', error);
    }
  }
}

// ============================================
// 使用示例
// ============================================

/**
 * 示例 1: 基础使用
 */
async function example1_basicUsage() {
  const client = new NextJsApiClient();

  try {
    // 调用业务 API
    const data = await client.request('/searchDataById', {
      body: { ids: ['device-1', 'device-2'] }
    });

    console.log('✅ 数据获取成功:', data);
    return data;
  } catch (error) {
    console.error('❌ 数据获取失败:', error);
  }
}

/**
 * 示例 2: 页面初始化
 */
async function example2_pageInit() {
  const client = new NextJsApiClient();

  // 处理 SSO 回调
  const hasAuth = await client.handleSSOCallback();

  if (hasAuth) {
    console.log('✅ 授权成功，已重新发起请求');
  } else {
    // 检查是否已登录
    const isAuth = await client.isAuthenticated();
    if (isAuth) {
      console.log('✅ 已登录，可以调用 API');
    } else {
      console.log('⚠️ 未登录，首次调用 API 时会自动跳转授权');
    }
  }
}

/**
 * 示例 3: 完整的页面加载流程
 */
async function loadDeviceData() {
  const client = new NextJsApiClient();

  try {
    // 显示加载状态
    const container = document.getElementById('device-list');
    if (container) {
      container.innerHTML = '<p>加载中...</p>';
    }

    // 调用 API（会自动处理授权流程）
    const data = await client.request('/searchDataById', {
      body: { ids: ['device-1', 'device-2'] }
    });

    // 渲染数据
    if (container && data) {
      container.innerHTML = `
        <h2>设备列表</h2>
        <ul>
          ${(data as any[]).map(device => `<li>${device.name || device.id}</li>`).join('')}
        </ul>
      `;
    }

    console.log('✅ 数据加载成功:', data);
  } catch (error) {
    console.error('❌ 数据加载失败:', error);

    const container = document.getElementById('device-list');
    if (container) {
      container.innerHTML = `<p style="color: red;">错误: ${(error as Error).message}</p>`;
    }
  }
}

/**
 * 示例 4: 页面初始化完整流程
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 页面加载完成');

    const client = new NextJsApiClient();

    // 1. 处理 SSO 回调（如果有）
    const hasAuth = await client.handleSSOCallback();

    // 2. 如果不是回调流程，正常加载数据
    if (!hasAuth) {
      await loadDeviceData();
    }
  });
}

// ============================================
// 使用说明
// ============================================

/**
 * 📖 完整的调用流程说明
 *
 * 【场景 1：首次访问，未登录】
 * 1. 用户访问页面
 * 2. 页面调用 client.request('/searchDataById', {...})
 * 3. 后端返回 { code: 401, msg: "Not authenticated" }
 * 4. 前端保存请求信息到 sessionStorage
 * 5. 前端跳转到 SSO 授权页
 * 6. 用户登录后，SSO 重定向回原页面，携带认证信息
 * 7. 前端检测到 URL 参数中的认证信息
 * 8. 前端调用 /api/auth/set 设置认证信息到后端
 * 9. 前端从 sessionStorage 恢复之前的请求
 * 10. 前端重新调用 client.request('/searchDataById', {...})
 * 11. 后端返回 { code: 0, data: {...} }
 * 12. 前端渲染数据
 *
 * 【场景 2：已登录，token 有效】
 * 1. 用户访问页面
 * 2. 页面调用 client.request('/searchDataById', {...})
 * 3. 后端返回 { code: 0, data: {...} }
 * 4. 前端直接渲染数据
 *
 * 【场景 3：已登录，token 过期但 refresh token 有效】
 * 1. 用户访问页面
 * 2. 页面调用 client.request('/searchDataById', {...})
 * 3. 后端检测到 access token 过期
 * 4. 后端自动使用 refresh token 刷新
 * 5. 后端使用新 token 重试请求
 * 6. 后端返回 { code: 0, data: {...} }
 * 7. 前端直接渲染数据
 *
 * 【场景 4：已登录，refresh token 也过期】
 * 1. 用户访问页面
 * 2. 页面调用 client.request('/searchDataById', {...})
 * 3. 后端检测到 access token 过期
 * 4. 后端尝试使用 refresh token 刷新
 * 5. 后端发现 refresh token 也过期
 * 6. 后端返回 { code: 401, msg: "Refresh token expired, please login again" }
 * 7. 前端保存请求信息并跳转到 SSO 授权页
 * 8. 后续流程同场景 1
 *
 *
 * 📖 后端 API 接口规范
 *
 * 1. POST /api/auth/set
 *    设置认证信息
 *    请求体: { accessToken, refreshToken, tenantId }
 *    响应: { success: true } 或 { success: false, error: "..." }
 *
 * 2. GET /api/auth/status
 *    检查登录状态
 *    响应: { authenticated: true } 或 { authenticated: false }
 *
 * 3. POST /api/auth/clear
 *    清除认证信息
 *    响应: { success: true }
 *
 * 4. POST /api/autopaddle/[...path]
 *    业务 API 代理
 *    请求体: 业务数据
 *    响应: { code: 0, data: {...} } 或 { code: 401, msg: "..." }
 *
 *
 * 📖 HTML 页面示例
 *
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <title>AutoPaddle 设备监控</title>
 * </head>
 * <body>
 *   <h1>设备监控系统</h1>
 *   <div id="device-list">
 *     <p>正在加载...</p>
 *   </div>
 *   <button id="refresh-button" onclick="loadDeviceData()">刷新数据</button>
 *   <script src="frontend-auth-example.js"></script>
 * </body>
 * </html>
 *
 *
 * 🔑 关键特性
 *
 * 1. 自动授权流程：首次调用 API 时自动跳转授权
 * 2. 请求恢复：授权后自动恢复之前的请求
 * 3. 透明刷新：后端自动处理 token 刷新，前端无感知
 * 4. 安全性：认证信息不暴露在前端，URL 参数立即清除
 * 5. 简单易用：前端只需调用 client.request()，无需关心授权细节
 * 6. 类型安全：完整的 TypeScript 类型定义
 */

// 导出供外部使用
export { NextJsApiClient, loadDeviceData };
export type { RequestOptions, ApiResponse, AuthInfo, PendingRequest };
