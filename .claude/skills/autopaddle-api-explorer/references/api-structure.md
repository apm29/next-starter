# API索引结构说明

本文档详细说明AutoPaddle API Explorer生成的索引文件的结构和数据格式。

## 索引文件概览

系统生成三个JSON索引文件：

1. **api-index.json** - 主索引，包含所有接口的完整信息
2. **keyword-index.json** - 关键词倒排索引，支持快速搜索
3. **category-index.json** - 分类索引，按功能模块分组

---

## 1. api-index.json (主索引)

### 文件结构

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-01-30T10:00:00.000Z",
  "server": {
    "url": "https://gateway.autopaddle.com",
    "authType": "Authorization"
  },
  "totalEndpoints": 245,
  "endpoints": {
    "PUT_/admin-api/device/type/update": { ... },
    "POST_/admin-api/device/type/create": { ... }
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| version | string | 索引版本号 |
| generatedAt | string | ISO 8601格式的生成时间 |
| server | object | API服务器信息 |
| server.url | string | API基础URL |
| server.authType | string | 认证类型 |
| totalEndpoints | number | 接口总数 |
| endpoints | object | 接口字典，键为`METHOD_PATH`格式 |

### Endpoint对象结构

每个endpoint对象包含以下字段：

```json
{
  "path": "/admin-api/device/type/update",
  "method": "PUT",
  "summary": "更新设备类型",
  "description": "更新设备类型的详细信息",
  "tags": ["管理后台 - 设备类型"],
  "operationId": "updateType",
  "parameters": [
    {
      "name": "id",
      "in": "query",
      "type": "string",
      "required": false,
      "description": "主键",
      "example": "6653"
    }
  ],
  "responses": {
    "200": {
      "description": "OK",
      "contentType": "*/*"
    }
  },
  "keywords": ["设备", "类型", "更新", "修改", "编辑"],
  "server": "https://gateway.autopaddle.com"
}
```

#### Endpoint字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | API路径（不含服务器地址） |
| method | string | HTTP方法（GET/POST/PUT/DELETE等） |
| summary | string | 接口简短描述 |
| description | string | 接口详细描述（可选） |
| tags | string[] | 分类标签数组 |
| operationId | string | 操作ID（从OpenAPI文档提取） |
| parameters | object[] | 请求参数数组 |
| responses | object | 响应信息字典（键为状态码） |
| keywords | string[] | 提取的关键词（用于搜索） |
| server | string | 完整服务器URL |

#### Parameter对象结构

```json
{
  "name": "id",
  "in": "query",
  "type": "string",
  "required": false,
  "description": "主键",
  "example": "6653"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 参数名 |
| in | string | 参数位置（query/path/body/header等） |
| type | string | 参数类型（string/number/boolean等） |
| required | boolean | 是否必需 |
| description | string | 参数说明 |
| example | any | 示例值（可选） |

#### Response对象结构

```json
{
  "200": {
    "description": "OK",
    "contentType": "*/*"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | 响应描述 |
| contentType | string | 响应内容类型 |

---

## 2. keyword-index.json (关键词倒排索引)

### 文件结构

```json
{
  "设备": {
    "endpoints": [
      "PUT_/admin-api/device/type/update",
      "POST_/admin-api/device/type/create",
      "GET_/admin-api/device/type/page"
    ],
    "count": 156
  },
  "创建": {
    "endpoints": [
      "POST_/admin-api/device/type/create",
      "POST_/admin-api/device/group/create"
    ],
    "count": 45
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| [关键词] | object | 关键词对应的索引对象 |
| endpoints | string[] | 包含该关键词的接口键列表 |
| count | number | 接口数量 |

### 使用场景

**快速关键词搜索**：

```javascript
// 查找包含"设备"的所有接口
const deviceEndpoints = keywordIndex['设备'].endpoints;

// 查找同时包含"设备"和"创建"的接口
const deviceEndpoints = new Set(keywordIndex['设备'].endpoints);
const createEndpoints = new Set(keywordIndex['创建'].endpoints);
const intersection = [...deviceEndpoints].filter(x => createEndpoints.has(x));
```

**关键词统计**：

```javascript
// 查找最热门的关键词
const topKeywords = Object.entries(keywordIndex)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10);
```

---

## 3. category-index.json (分类索引)

### 文件结构

```json
{
  "管理后台 - 设备类型": {
    "name": "管理后台 - 设备类型",
    "endpoints": [
      "POST_/admin-api/device/type/create",
      "GET_/admin-api/device/type/page",
      "PUT_/admin-api/device/type/update",
      "DELETE_/admin-api/device/type/delete",
      "GET_/admin-api/device/type/get"
    ],
    "count": 5
  },
  "管理后台 - 设备分组": {
    "name": "管理后台 - 设备分组",
    "endpoints": [...],
    "count": 8
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| [标签名] | object | 分类对象 |
| name | string | 分类名称 |
| endpoints | string[] | 该分类下的接口键列表 |
| count | number | 接口数量 |

### 使用场景

**按分类浏览**：

```javascript
// 获取所有设备相关的分类
const deviceCategories = Object.entries(categoryIndex)
  .filter(([tag, data]) => tag.includes('设备'))
  .map(([tag, data]) => ({
    tag,
    count: data.count
  }));

// 输出: [
//   { tag: "管理后台 - 设备类型", count: 5 },
//   { tag: "管理后台 - 设备分组", count: 8 },
//   ...
// ]
```

**统计接口分布**：

```javascript
// 统计每个分类的接口数量
const categoryStats = Object.entries(categoryIndex)
  .map(([tag, data]) => ({ tag, count: data.count }))
  .sort((a, b) => b.count - a.count);
```

---

## 索引键命名规范

### Endpoint键格式

```
{HTTP_METHOD}_{PATH}
```

示例：
- `PUT_/admin-api/device/type/update`
- `POST_/admin-api/device/group/create`
- `GET_/admin-api/device/type/page`

**规则**：
- HTTP方法全大写
- PATH保留原始格式（小写）
- 中间用下划线 `_` 分隔

### 键的唯一性

每个endpoint键在api-index.json中是唯一的，即使同一个路径有多个HTTP方法：

```json
{
  "GET_/admin-api/device/type/get": { ... },
  "POST_/admin-api/device/type/create": { ... },
  "PUT_/admin-api/device/type/update": { ... },
  "DELETE_/admin-api/device/type/delete": { ... }
}
```

---

## 关键词提取规则

### 中文分词

**规则**：提取2个及以上的连续中文字符

```javascript
// 输入: "创建设备类型"
// 输出: ["创建", "设备", "类型", "设备类型"]

// 输入: "GET /admin-api/device/type/page"
// 输出: ["设备", "类型"]
```

### 同义词扩展

自动扩展同义词以提高搜索召回率：

```javascript
const SYNONYMS = {
  '更新': ['修改', '编辑', '改变', '更改'],
  '创建': ['新增', '添加', '新建', '增加'],
  '查询': ['查看', '获取', '搜索', '检索', '列表'],
  '删除': ['移除', '清除']
};

// 输入关键词: "创建"
// 扩展后: ["创建", "新增", "添加", "新建", "增加"]
```

### 停用词过滤

不进行过滤，保留所有关键词以支持灵活搜索。

---

## 数据关联

### 三个索引文件的关系

```
api-index.json (主索引)
      ↓
      ├─ 提取关键词 → keyword-index.json
      └─ 按tags分组 → category-index.json
```

### 交叉引用

**从keyword-index到api-index**：

```javascript
// 1. 从keyword-index查找接口键
const endpointKeys = keywordIndex['设备'].endpoints;
// ['PUT_/admin-api/device/type/update', ...]

// 2. 使用这些键从api-index获取详情
const endpoints = endpointKeys.map(key => apiIndex.endpoints[key]);
```

**从category-index到api-index**：

```javascript
// 1. 从category-index查找接口键
const endpointKeys = categoryIndex['管理后台 - 设备类型'].endpoints;

// 2. 使用这些键从api-index获取详情
const endpoints = endpointKeys.map(key => apiIndex.endpoints[key]);
```

---

## 索引更新策略

### 版本控制

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-01-30T10:00:00.000Z"
}
```

- **version**: 索引格式版本，不随内容变化
- **generatedAt**: 索引生成时间，用于判断是否需要重新生成

### 增量更新（未实现）

当前版本每次完全重建索引，未来可支持增量更新：

```javascript
// 伪代码
if (fs.existsSync('api-index.json')) {
  const oldIndex = JSON.parse(fs.readFileSync('api-index.json'));
  const oldTime = new Date(oldIndex.generatedAt);
  const docTime = fs.statSync('devices.json').mtime;

  if (docTime > oldTime) {
    // 文档已更新，重新生成索引
    rebuildIndex();
  } else {
    // 文档未更新，使用缓存
    console.log('Using cached index');
  }
}
```

---

## 性能优化建议

### 1. 内存使用

- **api-index.json**: 完整加载到内存（~500KB）
- **keyword-index.json**: 完整加载到内存（~100KB）
- **category-index.json**: 完整加载到内存（~50KB）

总内存占用: ~650KB，可接受。

### 2. 查询优化

**关键词搜索**：

```javascript
// ❌ 慢: 遍历所有endpoint
for (const endpoint of Object.values(apiIndex.endpoints)) {
  if (endpoint.keywords.includes(keyword)) {
    results.push(endpoint);
  }
}

// ✅ 快: 直接查找keyword-index
const matches = keywordIndex[keyword]?.endpoints || [];
```

**分类浏览**：

```javascript
// ❌ 慢: 遍历所有endpoint过滤tags
for (const endpoint of Object.values(apiIndex.endpoints)) {
  if (endpoint.tags.includes('管理后台 - 设备类型')) {
    results.push(endpoint);
  }
}

// ✅ 快: 直接查找category-index
const matches = categoryIndex['管理后台 - 设备类型']?.endpoints || [];
```

### 3. 缓存策略

```javascript
// Node.js模块缓存（只加载一次）
let cachedIndex = null;

function getAPIIndex() {
  if (!cachedIndex) {
    cachedIndex = JSON.parse(fs.readFileSync('api-cache/api-index.json', 'utf8'));
  }
  return cachedIndex;
}
```

---

## 扩展指南

### 添加新的字段到Endpoint

修改 `scripts/build-index.js`：

```javascript
endpoints[key] = {
  path,
  method,
  summary,
  // ... 现有字段
  customField: extractCustomData(details)  // 新增字段
};
```

### 添加新的索引类型

例如，添加 `method-index.json`（按HTTP方法分组）：

```javascript
// 在 build-index.js 中添加
function buildMethodIndex(endpoints) {
  const methodIndex = {};

  for (const [key, endpoint] of Object.entries(endpoints)) {
    if (!methodIndex[endpoint.method]) {
      methodIndex[endpoint.method] = [];
    }
    methodIndex[endpoint.method].push(key);
  }

  return methodIndex;
}
```

### 自定义关键词提取

修改 `extractChineseKeywords` 函数：

```javascript
function extractChineseKeywords(text) {
  // 添加自定义规则
  const customMatches = text.match(/YOUR_PATTERN/g) || [];
  const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];

  return [...new Set([...customMatches, ...chineseMatches])];
}
```

---

## 故障排查

### 问题: 索引文件损坏

**症状**: `JSON.parse` 失败

**解决**:
```bash
# 重新生成索引
node .claude/skills/autopaddle-api-explorer/scripts/build-index.js

# 验证JSON格式
cat api-cache/api-index.json | jq .
```

### 问题: 索引不完整

**症状**: 某些接口缺失

**原因**: OpenAPI文档解析错误

**解决**:
```javascript
// 在 build-index.js 中添加调试日志
console.log('Parsed endpoints:', Object.keys(endpoints).length);
console.log('OpenAPI paths:', Object.keys(spec.paths).length);
```

---

## 参考资源

- [OpenAPI 3.0.1 规范](https://swagger.io/specification/)
- [JavaScript JSON处理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- [Node.js文件系统API](https://nodejs.org/api/fs.html)
