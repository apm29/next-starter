#!/usr/bin/env node

/**
 * AutoPaddle API Explorer - Index Builder
 *
 * 解析OpenAPI 3.0.1文档，生成可搜索的JSON索引
 *
 * 使用方法:
 *   node build-index.js
 *
 * 输出:
 *   - cache/api-index.json (主索引)
 *   - cache/keyword-index.json (关键词倒排索引)
 *   - cache/category-index.json (分类索引)
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // OpenAPI文档路径（相对于skill根目录）
  docs: [
    'assets/docs/devices.json',
    'assets/docs/report.json',
    'assets/docs/system.json',
  ],
  // 索引输出目录（skill内部）
  outputDir: path.resolve(__dirname, '../cache'),
  // skill根目录
  skillRoot: path.resolve(__dirname, '..')
};

// 同义词映射（用于扩展关键词）
const SYNONYMS = {
  '更新': ['修改', '编辑', '改变', '更改'],
  '创建': ['新增', '添加', '新建', '增加'],
  '查询': ['查看', '获取', '搜索', '检索', '列表'],
  '删除': ['移除', '清除', '删除']
};

/**
 * 提取中文关键词（2+字的中文词组）
 */
function extractChineseKeywords(text) {
  if (!text || typeof text !== 'string') return [];

  // 提取2个及以上的中文字符
  const matches = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  return [...new Set(matches)]; // 去重
}

/**
 * 扩展关键词（添加同义词）
 */
function expandKeywords(keywords) {
  const expanded = new Set(keywords);

  for (const keyword of keywords) {
    if (SYNONYMS[keyword]) {
      SYNONYMS[keyword].forEach(synonym => expanded.add(synonym));
    }
  }

  return Array.from(expanded);
}

/**
 * 解析OpenAPI文档，提取接口信息
 */
function parseOpenAPI(spec) {
  const endpoints = {};
  const categories = {};

  // 提取服务器信息
  const server = spec.servers && spec.servers[0] ? spec.servers[0].url : '';

  // 遍历所有路径
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    // 遍历所有HTTP方法
    for (const [method, details] of Object.entries(methods)) {
      const httpMethod = method.toUpperCase();
      const key = `${httpMethod}_${path}`;

      // 提取tags（分类）
      const tags = details.tags || ['未分类'];
      const tag = tags[0]; // 使用第一个tag作为主分类

      // 提取参数
      const parameters = (details.parameters || []).map(param => ({
        name: param.name,
        in: param.in,
        type: param.schema?.type || 'string',
        required: param.required || false,
        description: param.description || '',
        example: param.example
      }));

      // 提取响应信息
      const responses = {};
      if (details.responses) {
        for (const [code, resp] of Object.entries(details.responses)) {
          responses[code] = {
            description: resp.description || '',
            contentType: Object.keys(resp.content || {})[0] || ''
          };
        }
      }

      // 提取关键词（从summary和description）
      const summary = details.summary || '';
      const description = details.description || '';
      const allText = `${summary} ${description} ${tag} ${path}`;
      const keywords = extractChineseKeywords(allText);
      const expandedKeywords = expandKeywords(keywords);

      // 构建endpoint对象
      endpoints[key] = {
        path,
        method: httpMethod,
        summary,
        description,
        tags,
        operationId: details.operationId || '',
        parameters,
        responses,
        keywords: expandedKeywords,
        server
      };

      // 统计分类
      if (!categories[tag]) {
        categories[tag] = {
          name: tag,
          endpoints: [],
          count: 0
        };
      }
      categories[tag].endpoints.push(key);
      categories[tag].count++;
    }
  }

  return { endpoints, categories, server };
}

/**
 * 生成关键词倒排索引
 */
function buildKeywordIndex(endpoints) {
  const keywordIndex = {};

  for (const [key, endpoint] of Object.entries(endpoints)) {
    for (const keyword of endpoint.keywords) {
      if (!keywordIndex[keyword]) {
        keywordIndex[keyword] = [];
      }
      keywordIndex[keyword].push(key);
    }
  }

  // 统计每个关键词的接口数量
  for (const keyword in keywordIndex) {
    keywordIndex[keyword] = {
      endpoints: keywordIndex[keyword],
      count: keywordIndex[keyword].length
    };
  }

  return keywordIndex;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 AutoPaddle API Index Builder');
  console.log('================================\n');

  // 切换到skill根目录
  process.chdir(CONFIG.skillRoot);
  console.log(`📂 Skill root: ${CONFIG.skillRoot}`);

  // 检查文档文件是否存在
  const existingDocs = CONFIG.docs.filter(doc => {
    const fullPath = path.resolve(CONFIG.skillRoot, doc);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      console.warn(`⚠️  Document not found: ${doc}`);
    }
    return exists;
  });

  if (existingDocs.length === 0) {
    console.error('❌ No OpenAPI documents found!');
    process.exit(1);
  }

  console.log(`📄 Found ${existingDocs.length} document(s)\n`);

  // 创建输出目录
  const outputDir = path.resolve(CONFIG.skillRoot, CONFIG.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  // 合并所有文档的索引
  const allEndpoints = {};
  const allCategories = {};
  let serverUrl = '';

  for (const docPath of existingDocs) {
    console.log(`📖 Parsing: ${docPath}`);

    try {
      const fullPath = path.resolve(CONFIG.skillRoot, docPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const spec = JSON.parse(content);

      const { endpoints, categories, server } = parseOpenAPI(spec);

      // 合并endpoints
      Object.assign(allEndpoints, endpoints);

      // 合并categories
      for (const [tag, category] of Object.entries(categories)) {
        if (!allCategories[tag]) {
          allCategories[tag] = category;
        } else {
          allCategories[tag].endpoints.push(...category.endpoints);
          allCategories[tag].count += category.count;
        }
      }

      // 使用第一个找到的server
      if (!serverUrl && server) {
        serverUrl = server;
      }

      console.log(`   ✓ Found ${Object.keys(endpoints).length} endpoints`);
    } catch (error) {
      console.error(`   ✗ Error parsing ${docPath}:`, error.message);
    }
  }

  console.log(`\n📊 Total endpoints: ${Object.keys(allEndpoints).length}`);
  console.log(`📊 Total categories: ${Object.keys(allCategories).length}\n`);

  // 生成关键词索引
  console.log('🔑 Building keyword index...');
  const keywordIndex = buildKeywordIndex(allEndpoints);
  console.log(`   ✓ Found ${Object.keys(keywordIndex).length} unique keywords\n`);

  // 生成主索引文件
  console.log('💾 Saving api-index.json...');
  const apiIndex = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    server: {
      url: serverUrl,
      authType: 'Authorization'
    },
    totalEndpoints: Object.keys(allEndpoints).length,
    endpoints: allEndpoints
  };
  fs.writeFileSync(
    path.join(outputDir, 'api-index.json'),
    JSON.stringify(apiIndex, null, 2),
    'utf8'
  );
  console.log('   ✓ Saved\n');

  // 生成关键词索引文件
  console.log('💾 Saving keyword-index.json...');
  fs.writeFileSync(
    path.join(outputDir, 'keyword-index.json'),
    JSON.stringify(keywordIndex, null, 2),
    'utf8'
  );
  console.log('   ✓ Saved\n');

  // 生成分类索引文件
  console.log('💾 Saving category-index.json...');
  fs.writeFileSync(
    path.join(outputDir, 'category-index.json'),
    JSON.stringify(allCategories, null, 2),
    'utf8'
  );
  console.log('   ✓ Saved\n');

  console.log('✅ Index generation complete!\n');
  console.log('📂 Output files:');
  console.log(`   - ${path.join(outputDir, 'api-index.json')}`);
  console.log(`   - ${path.join(outputDir, 'keyword-index.json')}`);
  console.log(`   - ${path.join(outputDir, 'category-index.json')}`);
  console.log('');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { parseOpenAPI, buildKeywordIndex, extractChineseKeywords };
