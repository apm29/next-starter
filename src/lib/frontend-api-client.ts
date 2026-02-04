/**
 * Next.js 前端 API 客户端 - 自动授权流程
 *
 * 调用流程：
 * 1. 直接调用 Next.js 后端接口
 * 2. 返回 401 code 时进行跳转授权
 * 3. 获取认证信息调用 Next.js 后端的更新授权接口
 * 4. 重新发起刚才的调用
 * 5. 第一步成功的话直接返回结果
 */

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

interface PendingRequest {
  endpoint: string;
  options: RequestOptions;
}

class NextJsApiClient {
  private baseUrl: string;
  private authBaseUrl: string;
  private ssoBaseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.authBaseUrl = '/api/auth';
    this.ssoBaseUrl = 'https://gateway.autopaddle.com';
  }

  /**
   * 调用 Next.js 后端 API
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T | null> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // 1. 直接调用 Next.js 后端接口
      const response = await fetch(url, {
        method: options.method || 'GET',
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
        return null;
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

      const data = await response.json();

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
      const data = await response.json();
      return data.authenticated === true;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }
}

export default NextJsApiClient;
