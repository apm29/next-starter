#!/usr/bin/env node

/**
 * AutoPaddle API Explorer - Smart Intent Matcher
 *
 * 理解自然语言描述，智能推荐最相关的API接口
 *
 * 使用方法:
 *   node matcher.js "我想创建一个新的设备类型"
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  indexDir: path.resolve(__dirname, '../cache'),
  maxResults: 5
};

// 意图识别模式
const INTENT_PATTERNS = {
  create: {
    patterns: [/创建|新增|添加|新建|增加|添加|生成/],
    method: 'POST',
    pathSuffix: ['create', 'add', 'new']
  },
  query: {
    patterns: [/查询|查看|获取|搜索|检索|列表|显示|展示/],
    method: 'GET',
    pathSuffix: ['get', 'query', 'list', 'page', 'search']
  },
  update: {
    patterns: [/更新|修改|编辑|改变|更改|调整/],
    method: 'PUT',
    pathSuffix: ['update', 'modify', 'edit', 'change']
  },
  delete: {
    patterns: [/删除|移除|清除|删除/],
    method: 'DELETE',
    pathSuffix: ['delete', 'remove', 'clear']
  }
};

/**
 * 加载索引文件
 */
function loadIndices() {
  const apiIndexPath = path.join(CONFIG.indexDir, 'api-index.json');

  if (!fs.existsSync(apiIndexPath)) {
    console.error('❌ Index files not found! Please run build-index.js first.');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(apiIndexPath, 'utf8'));
}

/**
 * 识别用户意图
 */
function detectIntent(userInput) {
  const inputLower = userInput.toLowerCase();

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(userInput)) {
        return {
          name: intent,
          method: config.method,
          confidence: 0.8 // 基础置信度
        };
      }
    }
  }

  // 未识别到明确意图，返回null
  return null;
}

/**
 * 提取实体（关键词）
 */
function extractEntities(userInput) {
  const entities = {
    keywords: [],
    pathHints: []
  };

  // 提取中文关键词（2+字）
  const chineseWords = userInput.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  entities.keywords = chineseWords;

  // 提取路径提示
  const pathMappings = {
    '设备': 'device',
    '设备类型': 'device/type',
    '设备分组': 'device/group',
    '设备域': 'device/domain',
    '告警': 'alarm',
    '报告': 'report',
    '班次': 'shift',
    '用户': 'user',
    '部门': 'department'
  };

  for (const [chinese, english] of Object.entries(pathMappings)) {
    if (userInput.includes(chinese)) {
      entities.pathHints.push(english);
    }
  }

  return entities;
}

/**
 * 计算接口匹配度
 */
function calculateMatchScore(endpoint, intent, entities) {
  let score = 0;

  // 1. HTTP方法匹配 (40分)
  if (intent && endpoint.method === intent.method) {
    score += 40;
  } else if (!intent) {
    // 没有明确意图时，不扣分也不加分
    score += 20;
  }

  // 2. 路径匹配 (40分)
  const pathLower = endpoint.path.toLowerCase();
  for (const hint of entities.pathHints) {
    if (pathLower.includes(hint.toLowerCase())) {
      score += 40;
      break;
    }
  }

  // 3. 关键词匹配 (20分)
  const endpointText = `${endpoint.summary} ${endpoint.tags.join(' ')} ${endpoint.path}`.toLowerCase();
  for (const keyword of entities.keywords) {
    if (endpoint.keywords.includes(keyword) || endpointText.includes(keyword.toLowerCase())) {
      score += 20;
      break;
    }
  }

  return Math.min(score, 100);
}

/**
 * 智能匹配接口
 */
function match(userInput) {
  const apiIndex = loadIndices();

  // 1. 识别意图
  const intent = detectIntent(userInput);

  // 2. 提取实体
  const entities = extractEntities(userInput);

  // 3. 查找候选接口
  const candidates = Object.entries(apiIndex.endpoints).map(([key, endpoint]) => ({
    key,
    ...endpoint
  }));

  // 4. 计算匹配分数
  const scored = candidates.map(ep => ({
    ...ep,
    matchScore: calculateMatchScore(ep, intent, entities)
  }));

  // 5. 排序并返回Top N
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // 过滤掉分数太低的结果（<30分）
  const filtered = scored.filter(ep => ep.matchScore >= 30);

  return filtered.slice(0, CONFIG.maxResults);
}

/**
 * 格式化接口详情
 */
function formatEndpointDetail(endpoint) {
  let output = `### ${endpoint.method} ${endpoint.path}\n\n`;
  output += `**功能**: ${endpoint.summary}\n`;
  output += `**标签**: ${endpoint.tags.join(', ')}\n`;
  output += `**服务器**: ${endpoint.server}\n`;
  output += `**认证**: Authorization header required\n\n`;

  // 请求参数
  if (endpoint.parameters && endpoint.parameters.length > 0) {
    output += `#### 请求参数\n\n`;
    output += `| 参数名 | 位置 | 类型 | 必需 | 说明 |\n`;
    output += `|--------|------|------|------|------|\n`;

    for (const param of endpoint.parameters) {
      const required = param.required ? '✅' : '❌';
      output += `| ${param.name} | ${param.in} | ${param.type} | ${required} | ${param.description} |\n`;
    }
    output += '\n';
  }

  // 返回结果
  if (endpoint.responses && endpoint.responses['200']) {
    output += `#### 返回结果\n\n`;
    output += `状态码: 200 OK\n\n`;
    output += '```json\n';
    output += '{\n';
    output += '  "code": 0,\n';
    output += '  "msg": "操作成功",\n';
    output += '  "data": true\n';
    output += '}\n';
    output += '```\n\n';
  }

  // cURL示例
  output += `#### 示例请求\n\n`;
  output += '```bash\n';
  output += `curl -X ${endpoint.method} "${endpoint.server}${endpoint.path}" \\\n`;

  const params = endpoint.parameters || [];
  if (params.length > 0) {
    const queryParams = params.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
      const paramString = queryParams.map(p => {
        const value = p.example || `'${p.name}'`;
        return `  -d "${p.name}=${value}"`;
      }).join(' \\\n');
      output += paramString + ' \\\n';
    }
  }

  output += `  -H "Authorization: Bearer YOUR_TOKEN"\n`;
  output += '```\n\n';

  return output;
}

/**
 * 格式化匹配结果
 */
function formatMatchResults(results, userInput) {
  const intent = detectIntent(userInput);
  const entities = extractEntities(userInput);

  let output = `🤖 智能匹配结果\n`;
  output += `================\n\n`;
  output += `📝 用户输入: "${userInput}"\n\n`;

  if (intent) {
    output += `🎯 识别意图: ${intent.name} (${intent.method})\n`;
  } else {
    output += `🎯 识别意图: 未明确\n`;
  }

  if (entities.keywords.length > 0) {
    output += `🔑 关键词: ${entities.keywords.join(', ')}\n`;
  }

  if (entities.pathHints.length > 0) {
    output += `📍 路径提示: ${entities.pathHints.join(', ')}\n`;
  }

  output += '\n';

  if (results.length === 0) {
    output += `❌ 未找到匹配的接口\n\n`;
    output += `💡 建议:\n`;
    output += `   - 尝试使用更具体的关键词\n`;
    output += `   - 使用 search.js 进行关键词搜索\n`;
    return output;
  }

  output += `✅ 找到 ${results.length} 个相关接口\n\n`;

  // 显示最佳匹配
  const bestMatch = results[0];
  output += `🌟 最佳匹配 (${bestMatch.matchScore.toFixed(0)}%)\n`;
  output += `   ${bestMatch.method} ${bestMatch.path} - ${bestMatch.summary}\n\n`;

  // 显示其他匹配
  if (results.length > 1) {
    output += `📋 其他相关接口\n\n`;
    for (let i = 1; i < results.length; i++) {
      const ep = results[i];
      output += `${i}. ${ep.method} ${ep.path} - ${ep.summary} (${ep.matchScore.toFixed(0)}%)\n`;
    }
    output += '\n';
  }

  // 显示最佳匹配的详细信息
  output += `📄 最佳匹配详情\n\n`;
  output += formatEndpointDetail(bestMatch);

  return output;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node matcher.js "自然语言描述"');
    console.log('');
    console.log('Examples:');
    console.log('  node matcher.js "我想创建一个新的设备类型"');
    console.log('  node matcher.js "查看所有设备的列表"');
    console.log('  node matcher.js "更新设备的配置信息"');
    console.log('  node matcher.js "删除不需要的设备"');
    process.exit(1);
  }

  const userInput = args.join(' ');
  const results = match(userInput);
  console.log(formatMatchResults(results, userInput));
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { match, formatMatchResults, detectIntent, extractEntities };
