# 快速开始指南

## 5分钟上手 AutoPaddle API Explorer

### Step 1: 生成索引（首次使用）

在项目根目录运行：

```bash
node .claude/skills/autopaddle-api-explorer/scripts/build-index.js
```

**输出示例**：
```
🔍 AutoPaddle API Index Builder
================================

📂 Project root: /path/to/project
📄 Found 2 document(s)

📖 Parsing: public/example-apps/autopadle-report-app/docs/devices.json
   ✓ Found 156 endpoints
📖 Parsing: public/example-apps/autopadle-report-app/docs/report.json
   ✓ Found 89 endpoints

📊 Total endpoints: 245
📊 Total categories: 18

🔑 Building keyword index...
   ✓ Found 1234 unique keywords

💾 Saving api-index.json...
   ✓ Saved

💾 Saving keyword-index.json...
   ✓ Saved

💾 Saving category-index.json...
   ✓ Saved

✅ Index generation complete!
```

**生成的文件**：
- `api-cache/api-index.json` - 主索引
- `api-cache/keyword-index.json` - 关键词索引
- `api-cache/category-index.json` - 分类索引

### Step 2: 测试搜索功能

```bash
# 关键词搜索
node .claude/skills/autopaddle-api-explorer/scripts/search.js "设备 创建"

# 带过滤条件的搜索
node .claude/skills/autopaddle-api-explorer/scripts/search.js "查询" --method GET
```

### Step 3: 测试智能匹配

```bash
node .claude/skills/autopaddle-api-explorer/scripts/matcher.js "我想创建一个新的设备类型"
```

## 常见使用场景

### 场景1: 用户问"有哪些设备管理的API？"

**Agent操作**：

```javascript
// 1. 读取分类索引
const categoryIndex = JSON.parse(fs.readFileSync('api-cache/category-index.json', 'utf8'));

// 2. 筛选包含"设备"的分类
const deviceCategories = Object.entries(categoryIndex)
  .filter(([tag, data]) => tag.includes('设备') || data.name.includes('设备'));

// 3. 返回结果
console.log('📂 设备管理相关接口 (共245个)');
deviceCategories.forEach(([tag, data]) => {
  console.log(`   ├─ ${tag} (${data.count}个)`);
});
```

**输出**：
```
📂 设备管理相关接口 (共156个)
   ├─ 管理后台 - 设备类型 (5个)
   ├─ 管理后台 - 设备分组 (8个)
   ├─ 管理后台 - 设备域 (12个)
   └─ 管理后台 - 设备告警 (15个)
```

### 场景2: 用户问"搜索创建设备的接口"

**Agent操作**：

```bash
node .claude/skills/autopaddle-api-explorer/scripts/search.js "设备 创建"
```

**输出**：
```
🔍 搜索结果: "设备 创建"
找到 5 个相关接口

1. POST /admin-api/device/type/create - 创建设备类型
   📊 相关度: 95% [██████████]
   🏷️  标签: 管理后台 - 设备类型
   📥 参数: name(必需), type(必需), sorted(可选), remark(可选)

2. POST /admin-api/device/group/create - 创建设备分组
   📊 相关度: 88% [████████░░]
   🏷️  标签: 管理后台 - 设备分组
   📥 参数: name(必需), parentId(可选), remark(可选)
```

### 场景3: 用户问"我想添加一个新设备类型，应该调用哪个接口？"

**Agent操作**：

```bash
node .claude/skills/autopaddle-api-explorer/scripts/matcher.js "添加一个新的设备类型"
```

**输出**：
```
🤖 智能匹配结果
================

📝 用户输入: "添加一个新的设备类型"

🎯 识别意图: create (POST)
🔑 关键词: 添加, 新, 设备类型
📍 路径提示: device/type

✅ 找到 3 个相关接口

🌟 最佳匹配 (98%)
   POST /admin-api/device/type/create - 创建设备类型

📄 最佳匹配详情
...

### POST /admin-api/device/type/create

**功能**: 创建设备类型
**标签**: 管理后台 - 设备类型

#### 请求参数

| 参数名 | 位置 | 类型 | 必需 | 说明 |
|--------|------|------|------|------|
| name | query | string | ✅ | 类型名称 |
| type | query | string | ✅ | 分类 1设备直采 2OCR 3文件 |
| sorted | query | string | ❌ | 排序 |
| remark | query | string | ❌ | 备注 |

#### 示例请求

```bash
curl -X POST "https://gateway.autopaddle.com/admin-api/device/type/create" \
  -d "name=新类型" \
  -d "type=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
```

## Agent集成示例

### 在对话中使用

当用户询问API相关问题时：

```javascript
// 检查索引是否存在
const indexPath = 'api-cache/api-index.json';
if (!fs.existsSync(indexPath)) {
  // 首次使用，生成索引
  execSync('node .claude/skills/autopaddle-api-explorer/scripts/build-index.js');
}

// 根据用户问题选择查询模式
if (userQuery.includes('有哪些') || userQuery.includes('列表')) {
  // 分类浏览模式
  const categories = getCategoryIndex();
  return browseCategories(categories, userQuery);
} else if (userQuery.includes('搜索') || userQuery.includes('查找')) {
  // 关键词搜索模式
  return searchAPIs(userQuery);
} else {
  // 智能匹配模式
  return matchAPIs(userQuery);
}
```

### 辅助函数

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

function searchAPIs(query) {
  const result = execSync(
    `node .claude/skills/autopaddle-api-explorer/scripts/search.js "${query}"`,
    { encoding: 'utf8' }
  );
  return result;
}

function matchAPIs(query) {
  const result = execSync(
    `node .claude/skills/autopaddle-api-explorer/scripts/matcher.js "${query}"`,
    { encoding: 'utf8' }
  );
  return result;
}

function getCategoryIndex() {
  const content = fs.readFileSync('api-cache/category-index.json', 'utf8');
  return JSON.parse(content);
}
```

## 最佳实践

### 1. 索引生成时机

- ✅ **首次使用**: 必须生成索引
- ✅ **OpenAPI文档更新后**: 重新生成索引
- ❌ **每次查询前**: 不需要，使用缓存即可

### 2. 选择合适的查询模式

| 用户问题类型 | 推荐模式 | 命令/方法 |
|------------|---------|----------|
| "有哪些XX的API？" | 分类浏览 | 读取category-index.json |
| "搜索XX接口" | 关键词搜索 | search.js |
| "我想XX（自然语言）" | 智能匹配 | matcher.js |
| "查看XX接口详情" | 直接查询 | 读取api-index.json |

### 3. 提高搜索准确性

**技巧1: 使用精准关键词**
```bash
# ❌ 太宽泛
node search.js "设备"

# ✅ 更精准
node search.js "设备类型 创建"
```

**技巧2: 结合HTTP方法**
```bash
node search.js "设备" --method POST
node search.js "查询" --method GET
```

**技巧3: 使用标签过滤**
```bash
node search.js "更新" --tag "管理后台 - 设备类型"
```

### 4. 处理查询结果

**场景: 搜索结果过多**

```javascript
const results = searchAPIs("设备");
const lines = results.split('\n');
const count = parseInt(lines[1].match(/找到 (\d+) 个/)[1]);

if (count > 10) {
  // 建议用户使用更具体的搜索词
  return `找到 ${count} 个相关接口，建议使用更具体的关键词，如"设备类型 创建"`;
}
```

**场景: 搜索结果为空**

```javascript
const results = searchAPIs("不存在的关键词");
if (results.includes('未找到')) {
  // 尝试智能匹配
  return matchAPIs("不存在的关键词");
}
```

## 故障排查

### 问题: 索引生成失败

**可能原因**：
1. OpenAPI文档路径不存在
2. 文档格式错误（非有效的JSON）

**解决方法**：
```bash
# 检查文档是否存在
ls public/example-apps/autopadle-report-app/docs/

# 验证JSON格式
cat public/example-apps/autopadle-report-app/docs/devices.json | jq .
```

### 问题: 搜索返回空结果

**可能原因**：
1. 关键词不匹配
2. 索引文件损坏

**解决方法**：
```bash
# 重新生成索引
node .claude/skills/autopaddle-api-explorer/scripts/build-index.js

# 使用更通用的关键词
node search.js "设备"  # 而非 "设备类型创建管理"
```

### 问题: 智能匹配不准确

**解决方法**：
- 使用更具体的描述（"创建设备类型"而非"弄个设备"）
- 手动添加同义词到 `scripts/matcher.js` 的 `SYNONYMS` 对象

## 下一步

- 阅读 [API结构说明](api-structure.md) 了解索引的详细结构
- 查看 [SKILL.md](../SKILL.md) 了解三种查询模式的完整文档
- 根据需要自定义意图识别规则
