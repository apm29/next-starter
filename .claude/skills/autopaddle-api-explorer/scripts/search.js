#!/usr/bin/env node

/**
 * AutoPaddle API Explorer - Search Engine
 *
 * 基于关键词搜索API接口
 *
 * 使用方法:
 *   node search.js "关键词"
 *   node search.js "设备 创建" --method POST
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  indexDir: path.resolve(__dirname, '../cache'),
  maxResults: 10
};

/**
 * 加载索引文件
 */
function loadIndices() {
  const apiIndexPath = path.join(CONFIG.indexDir, 'api-index.json');
  const keywordIndexPath = path.join(CONFIG.indexDir, 'keyword-index.json');

  if (!fs.existsSync(apiIndexPath) || !fs.existsSync(keywordIndexPath)) {
    console.error('❌ Index files not found! Please run build-index.js first.');
    process.exit(1);
  }

  const apiIndex = JSON.parse(fs.readFileSync(apiIndexPath, 'utf8'));
  const keywordIndex = JSON.parse(fs.readFileSync(keywordIndexPath, 'utf8'));

  return { apiIndex, keywordIndex };
}

/**
 * 计算相关度分数
 */
function calculateRelevance(endpoint, queryKeywords, queryLower) {
  let score = 0;
  const endpointText = `${endpoint.summary} ${endpoint.tags.join(' ')} ${endpoint.path}`.toLowerCase();

  // 1. 关键词匹配度 (50%)
  const matchedKeywords = queryKeywords.filter(kw =>
    endpoint.keywords.includes(kw) ||
    endpointText.includes(kw.toLowerCase())
  );
  score += (matchedKeywords.length / queryKeywords.length) * 50;

  // 2. 路径匹配度 (30%)
  for (const keyword of queryKeywords) {
    if (endpoint.path.toLowerCase().includes(keyword.toLowerCase())) {
      score += 30;
      break;
    }
  }

  // 3. summary完全匹配度 (20%)
  if (endpoint.summary.toLowerCase().includes(queryLower)) {
    score += 20;
  }

  return Math.min(score, 100);
}

/**
 * 搜索接口
 */
function search(query, options = {}) {
  const { apiIndex, keywordIndex } = loadIndices();

  // 提取查询关键词
  const keywords = query.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
  const queryLower = query.toLowerCase();

  // 从关键词索引中查找匹配的接口
  const matchedKeys = new Set();
  for (const keyword of keywords) {
    // 精确匹配
    if (keywordIndex[keyword]) {
      keywordIndex[keyword].endpoints.forEach(key => matchedKeys.add(key));
    }

    // 模糊匹配（关键词包含查询词）
    for (const [indexKeyword, data] of Object.entries(keywordIndex)) {
      if (indexKeyword.includes(keyword) || keyword.includes(indexKeyword)) {
        data.endpoints.forEach(key => matchedKeys.add(key));
      }
    }
  }

  // 获取接口详情
  let endpoints = Array.from(matchedKeys).map(key => ({
    key,
    ...apiIndex.endpoints[key]
  }));

  // 应用过滤器
  if (options.method) {
    endpoints = endpoints.filter(ep => ep.method === options.method.toUpperCase());
  }

  if (options.tag) {
    endpoints = endpoints.filter(ep => ep.tags.includes(options.tag));
  }

  // 计算相关度并排序
  endpoints = endpoints.map(ep => ({
    ...ep,
    relevance: calculateRelevance(ep, keywords, queryLower)
  }));

  endpoints.sort((a, b) => b.relevance - a.relevance);

  // 限制结果数量
  return endpoints.slice(0, CONFIG.maxResults);
}

/**
 * 格式化输出结果
 */
function formatResults(results, query) {
  if (results.length === 0) {
    return `❌ 未找到与 "${query}" 相关的接口\n`;
  }

  let output = `🔍 搜索结果: "${query}"\n`;
  output += `找到 ${results.length} 个相关接口\n\n`;

  results.forEach((ep, index) => {
    const relevanceBar = '█'.repeat(Math.floor(ep.relevance / 10)) + '░'.repeat(10 - Math.floor(ep.relevance / 10));
    output += `${index + 1}. ${ep.method} ${ep.path} - ${ep.summary}\n`;
    output += `   📊 相关度: ${ep.relevance.toFixed(0)}% [${relevanceBar}]\n`;
    output += `   🏷️  标签: ${ep.tags.join(', ')}\n`;

    if (ep.parameters && ep.parameters.length > 0) {
      const requiredParams = ep.parameters.filter(p => p.required).map(p => p.name);
      const optionalParams = ep.parameters.filter(p => !p.required).map(p => p.name);

      if (requiredParams.length > 0) {
        output += `   📥 参数: ${requiredParams.join(', ')}(必需)`;
        if (optionalParams.length > 0) {
          output += `, ${optionalParams.slice(0, 3).join(', ')}(可选)`;
        }
        output += '\n';
      }
    }

    output += '\n';
  });

  return output;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node search.js "关键词" [--method POST] [--tag "分类"]');
    console.log('');
    console.log('Examples:');
    console.log('  node search.js "设备 创建"');
    console.log('  node search.js "设备" --method POST');
    console.log('  node search.js "查询" --tag "管理后台 - 设备类型"');
    process.exit(1);
  }

  const query = args[0];
  const options = {};

  // 解析选项
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--method' && args[i + 1]) {
      options.method = args[i + 1];
      i++;
    } else if (args[i] === '--tag' && args[i + 1]) {
      options.tag = args[i + 1];
      i++;
    }
  }

  const results = search(query, options);
  console.log(formatResults(results, query));
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { search, formatResults };
