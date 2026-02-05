'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import NextJsApiClient from '@/lib/frontend-api-client';

interface Device {
  deviceId: string;
  deviceName: string;
  deviceNo: string;
  status: string;
  deviceTypeId: string;
  updateTime: string;
}

interface DeviceListResponse {
  list: Device[];
  total: number;
  page: number;
  pageSize: number;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deviceTypeDict, setDeviceTypeDict] = useState<Record<string, any>>({});
  const pageSize = 20;

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

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await client.request<DeviceListResponse>(
        `/devices/list?page=${currentPage}&pageSize=${pageSize}&search=${searchTerm}&status=${statusFilter}`,
        { method: 'GET' }
      );

      if (data) {
        setDevices(data.list || []);
        setTotal(data.total || 0);
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
        // 先获取设备类型字典，再获取设备列表
        await fetchDeviceTypes();
        fetchDevices();
      }
    };
    handleCallback();
  }, []);

  // 当搜索、筛选、分页变化时重新获取数据
  useEffect(() => {
    fetchDevices();
  }, [currentPage, searchTerm, statusFilter]);

  // // 自动刷新（每10秒）
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchDevices();
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [currentPage, searchTerm, statusFilter]);

  // 状态徽章样式
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      online: { label: '在线', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      offline: { label: '离线', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      fault: { label: '故障', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // 分页控制
  const totalPages = Math.ceil(total / pageSize);
  const pageNumbers = [];
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">设备列表</h1>
          <button
            onClick={fetchDevices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="搜索设备名称..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">全部状态</option>
              <option value="online">在线</option>
              <option value="offline">离线</option>
              <option value="fault">故障</option>
            </select>
          </div>
        </div>

        {/* 设备列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              加载中...
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {error}
              </p>
              <button
                onClick={fetchDevices}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && devices.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无设备数据
            </div>
          )}

          {!loading && !error && devices.length > 0 && (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      设备名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      设备编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      设备类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      最后更新
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {devices.map((device) => (
                    <tr key={device.deviceId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/devices/${device.deviceId}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          {device.deviceName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {device.deviceNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(device.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {device.deviceTypeId && deviceTypeDict[device.deviceTypeId]
                          ? deviceTypeDict[device.deviceTypeId].name
                          : device.deviceTypeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                        {device.updateTime ? dayjs(device.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 分页 */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  共 <span className="font-medium">{total}</span> 条记录
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    上一页
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
