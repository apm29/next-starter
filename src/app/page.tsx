import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={120}
              height={24}
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AutoPaddle 设备监控系统 📱
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            实时监控设备状态，查看设备引脚数据，管理设备信息
          </p>
        </div>

        {/* 导航卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* 设备列表卡片 */}
          <Link
            href="/devices"
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="p-8">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📱
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                设备列表
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                查看所有设备，搜索和筛选设备状态
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                进入查看
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          </Link>

          {/* 实时监控卡片（预留） */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden opacity-60 cursor-not-allowed">
            <div className="p-8">
              <div className="text-5xl mb-4">
                📊
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                实时监控
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                实时查看设备运行数据和趋势图表
              </p>
              <div className="flex items-center text-gray-400 font-medium">
                即将推出
              </div>
            </div>
            <div className="h-2 bg-gray-300 dark:bg-gray-700"></div>
          </div>

          {/* 告警管理卡片（预留） */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden opacity-60 cursor-not-allowed">
            <div className="p-8">
              <div className="text-5xl mb-4">
                🔔
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                告警管理
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                查看和管理设备告警信息
              </p>
              <div className="flex items-center text-gray-400 font-medium">
                即将推出
              </div>
            </div>
            <div className="h-2 bg-gray-300 dark:bg-gray-700"></div>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            核心功能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">实时数据</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                从 InfluxDB 查询设备引脚最新值
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">智能搜索</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                按设备名称搜索，按状态筛选
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">安全认证</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                SSO 单点登录，自动 token 刷新
              </p>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-16 text-center">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="mr-2">📖</span>
            查看 Next.js 文档
          </a>
        </div>
      </div>
    </div>
  );
}
