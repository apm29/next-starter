/**
 * AutoPaddle API Client with automatic token refresh
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
   * Make API request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Tenant-ID': this.tenantId,
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });
    let data = await response.json();

    // Handle token expiration
    if (data.code === 401) {
      try {
        await this.refreshAccessToken();

        // Retry with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
        data = await response.json();
      } catch (error) {
        // 如果刷新token失败，直接返回401错误对象让前端处理
        if (error instanceof AuthenticationError) {
          return { code: 401, msg: "Refresh token expired, please login again" } as any;
        }
        throw error;
      }
    }

    if (data.code !== 0) {
      throw new Error(data.msg || 'API request failed');
    }

    return data.data;
  }

  /**
   * Refresh access token
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

    // ✨ 新增：处理 refresh token 失效（401）
    // 抛出 AuthenticationError，由前端捕获并处理跳转
    if (data.code === 401) {
      throw new AuthenticationError('Refresh token expired, please login again');
    }

    if (data.code !== 0) {
      throw new Error('Failed to refresh token');
    }

    this.accessToken = data.data.accessToken;
  }

}

export default AutoPaddleClient;
