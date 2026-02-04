'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import NextJsApiClient from '@/lib/frontend-api-client';

interface DeviceDetail {
  deviceId: string;
  deviceName: string;
  deviceNo: string;
  status: string;
  deviceType: string;
  updateTime: string;
  [key: string]: any;
}

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.deviceId as string;

  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceTypeDict, setDeviceTypeDict] = useState<Record<string, any>>({});

  const client = useMemo(() => new NextJsApiClient(), []);

  // 获取设备类型字典
  const fetchDeviceTypes = async () => {
    try {
      const data = await client.request<any>(
        '/device-types',
        { method: 'GET' }
      );

      if (data && data.dict) {
        setDeviceTypeDict(data.dict);
      }
    } catch (err) {
      console.error('获取设备类型失败:', err);
    }
  };

  // 获取设备详情
  const fetchDeviceDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await client.request<DeviceDetail>(
        `/devices/${deviceId}`,
        { method: 'GET' }
      );

      if (data) {
        setDevice(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 处理 SSO 回调
  useEffect(() => {
    const handleCallback = async () => {
      const hasAuth = await client.handleSSOCallback();
      if (!hasAuth) {
        // 先获取设备类型字典，再获取设备详情
        await fetchDeviceTypes();
        fetchDeviceDetail();
      }
    };
    handleCallback();
  }, [deviceId]);

  // 状态徽章样式
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      online: { label: '在线', className: 'bg-green-100 text-green-800' },
      offline: { label: '离线', className: 'bg-gray-100 text-gray-800' },
      fault: { label: '故障', className: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-blue-100 text-blue-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/devices')}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← 返回设备列表
        </button>

        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">设备详情 🔧</h1>
          <button
            onClick={fetchDeviceDetail}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 刷新
          </button>
        </div>

        {/* 设备详情卡片 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              加载中...
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">❌ {error}</p>
              <button
                onClick={fetchDeviceDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && device && (
            <div className="p-6">
              {/* 基本信息 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">设备名称</label>
                    <p className="text-lg text-gray-900">{device.deviceName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">设备编号</label>
                    <p className="text-lg text-gray-900">{device.deviceNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">设备状态</label>
                    <div>{getStatusBadge(device.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">设备类型</label>
                    <p className="text-lg text-gray-900">
                      {device.deviceTypeId && deviceTypeDict[device.deviceTypeId]
                        ? deviceTypeDict[device.deviceTypeId].name
                        : device.deviceType}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">最后更新时间</label>
                    <p className="text-lg text-gray-900">
                      {device.updateTime ? dayjs(device.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">设备ID</label>
                    <p className="text-sm text-gray-600 font-mono">{device.deviceId}</p>
                  </div>
                </div>
              </div>

              {/* 其他信息 */}
              {Object.keys(device).filter(key =>
                !['deviceId', 'deviceName', 'deviceNo', 'status', 'deviceType', 'updateTime'].includes(key)
              ).length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">详细信息</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(device).filter(([key]) =>
                            !['deviceId', 'deviceName', 'deviceNo', 'status', 'deviceType', 'updateTime'].includes(key)
                          )
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !device && (
            <div className="p-8 text-center text-gray-500">
              未找到设备信息
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
