/**
 * AutoPaddle 后端 API 客户端 - 自动 token 刷新
 */

/**
 * 自定义错误类：认证失败错误
 * 当 refresh token 失效时抛出此错误，前端应捕获并跳转到登录页
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed, please login again') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

interface AutoPaddleConfig {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  baseUrl?: string;
}

class AutoPaddleClient {
  private accessToken: string;
  private refreshToken: string;
  private tenantId: string;
  private baseUrl: string;

  constructor(config: AutoPaddleConfig) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.tenantId = config.tenantId;
    this.baseUrl = config.baseUrl || 'https://gateway.autopaddle.com';
  }

  /**
   * 发起 API 请求，自动处理 token 刷新
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Tenant-ID': this.tenantId,
      'Content-Type': 'application/json',
      ...options.headers,
    };
    // console.log(url,headers);
    
    let response = await fetch(url, { ...options, headers });
    let data = await response.json();

    // 处理 token 过期
    if (data.code === 401) {
      try {
        await this.refreshAccessToken();

        // 使用新 token 重试
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
        data = await response.json();
      } catch (error) {
        // 如果刷新 token 失败，返回 401 错误对象让前端处理
        if (error instanceof AuthenticationError) {
          return { code: 401, msg: "Refresh token expired, please login again" } as any;
        }
        throw error;
      }
    }

    if (data.code !== 0) {
      console.log('API request error:', data);
      throw new Error(data.msg || 'API request failed');
    }

    return data.data;
  }

  /**
   * 刷新 access token
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/admin-api/system/auth/refresh-token?refreshToken=${this.refreshToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Tenant-ID': this.tenantId,
        },
      }
    );

    const data = await response.json();
    
    // 处理 refresh token 失效（401）
    if (data.code === 401 || data.code === 400 || data.code === 403) {
      throw new AuthenticationError('Refresh token expired, please login again');
    }

    if (data.code !== 0) {
      throw new Error('Failed to refresh token');
    }

    this.accessToken = data.data.accessToken;
  }

  /**
   * 获取当前 access token
   */
  getAccessToken(): string {
    return this.accessToken;
  }
}

export default AutoPaddleClient;
