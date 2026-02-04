---
name: autopaddle-nextjs-builder
description: Build Next.js applications for AutoPaddle platform with cloud service integration and local InfluxDB connectivity. MANDATORY WORKFLOW: (1) Before building, MUST call autopaddle-app-pm skill to clarify requirements, (2) After building, MUST call autopaddle-app-reviewer skill to verify UX compliance. Use when users request building AutoPaddle apps, creating data visualization dashboards, developing device monitoring applications, or constructing business data reporting tools that need to interact with AutoPaddle cloud APIs and local InfluxDB time-series data.
---

# AutoPaddle Next.js Application Builder

Build production-ready Next.js applications that integrate with AutoPaddle cloud services and local InfluxDB.

## Quick Start

**IMPORTANT**: This skill follows a mandatory workflow that includes requirement gathering and quality assurance:

1. **Requirement Gathering** (MUST DO) - Call `autopaddle-app-pm` skill first to clarify requirements
2. **Understand requirements** - Review the clarified requirements from PM skill
3. **Set up project** - Use the Next.js template from `assets/nextjs-template/`
4. **Implement data fetching** - Reference `references/api-reference.md` for AutoPaddle APIs
5. **Get api documents** - Call `autopaddle-api-explorer` skill for AutoPaddle APIs
6. **Query time-series data** - See `references/influxdb-guide.md` for InfluxDB patterns
7. **Build and deploy** - Generate server.js for production
8. **Quality Assurance** (MUST DO) - Call `autopaddle-app-reviewer` skill to verify implementation

## Technology Stack Requirements

**MANDATORY**: All applications built with this skill MUST use the following exact versions:

- **Next.js**: `^16.0.0` - Latest Next.js framework with App Router
- **React**: `^18.0.0` - React 18 with concurrent features
- **PostCSS**: `^8.5.0` - CSS processing and transformation
- **Tailwind CSS**: `^3.4.0` - Utility-first CSS framework

**Version Enforcement:**
- Use these exact versions in `package.json` dependencies
- Do not upgrade or downgrade without explicit approval
- Ensure compatibility between all dependencies
- Test thoroughly with these specific versions

**Example package.json:**
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## Application Architecture

### Environment Variables

The built application receives these environment variables from the parent process:

**必需的环境变量：**
- `PORT` - Server port
- `GATEWAY_IP` - Host IP address (default: localhost)
- `GATEWAY_APP_ID` - Application ID
- `GATEWAY_APP_SECRET` - Application secret

**可选的环境变量（用于已有认证信息的场景）：**
- `REFRESH_TOKEN` - AutoPaddle refresh token (30-day validity)
- `ACCESS_TOKEN` - AutoPaddle access token (10-minute validity)
- `TENANT_ID` - Tenant identifier for API calls

**说明：**
- 如果未提供 `REFRESH_TOKEN`、`ACCESS_TOKEN`、`TENANT_ID`，应用可以通过 SSO 单点登录方式获取认证信息
- 参考 `assets/sso-example.html` 了解如何接收和处理 SSO 认证信息

### Build Output

After `npm run build`, the application must provide a `server.js` script that:
- Accepts the environment variables above
- Runs as a standalone Node.js server
- Handles token refresh automatically when receiving 401 responses

## Data Integration

### AutoPaddle Cloud APIs

For detailed API specifications, see [references/api-reference.md](references/api-reference.md).

**Key patterns:**
- Include `Authorization: Bearer ${accessToken}` and `Tenant-ID: ${tenantId}` headers
- Handle 401 responses by refreshing tokens
- Parse response format: `{code: 0, data: {...}, msg: ""}`

### InfluxDB Time-Series Data

For InfluxDB connection details and query patterns, see [references/influxdb-guide.md](references/influxdb-guide.md).

**Connection:**
- URL: `http://${GATEWAY_IP}:18086`
- Organization: `autopaddle`
- Bucket: `autopaddle-bucket`
- Token: `autopaddle-api-token`

### Query Patterns

For common data query workflows, see [references/data-query-patterns.md](references/data-query-patterns.md).

**Session-based queries:**
1. Initiate query with sessionId
2. Poll for results using sessionId
3. Parse returned data

## Templates

### 后端 API 客户端模板

使用 `assets/backend-api-client-template.ts` 获取后端 API 客户端示例，用于 Next.js 后端从 AutoPaddle 云服务获取数据：

**核心功能：**
- ✅ 自动 token 刷新逻辑
- ✅ Refresh token 失效处理（返回 `{ code: 401, msg: "Refresh token expired, please login again" }`）
- ✅ 统一的错误处理
- ✅ 类型安全的 TypeScript 实现

**使用场景：**
- Next.js API 路由（`/api/autopaddle/*`）
- 服务端数据获取
- 后端代理 AutoPaddle API

**关键特性：**
- 当 access token 过期时，自动使用 refresh token 刷新
- 当 refresh token 也过期时，返回 401 错误对象让前端处理
- 认证信息存储在后端，不暴露给前端

---

### 前端 API 客户端模板

使用 `assets/frontend-api-client-template.ts` 获取一个前端 API 客户端模板，用于前端调用 Next.js 后端 API：

**核心功能：**
- ✅ 自动授权流程（检测 401 自动跳转 SSO）
- ✅ 请求恢复（授权后自动恢复之前的请求）
- ✅ SSO 回调处理（自动提取认证信息并设置到后端）
- ✅ 类型安全的 TypeScript 实现

**使用场景：**
- Next.js 前端页面
- React 组件
- 任何需要调用后端 API 的前端代码

**关键特性：**
- 前端不存储任何认证信息（更安全）
- 通过 `/api/auth/*` 接口与后端交互
- 自动处理完整的授权流程，前端无需关心 token 刷新

**完整的调用流程：**
1. 直接调用 Next.js 后端接口
2. 返回 401 code 时进行跳转授权
3. 获取认证信息调用 Next.js 后端的更新授权接口
4. 重新发起刚才的调用
5. 第一步成功的话直接返回结果

---

### 架构说明

**前后端分离的认证架构：**

```
前端 (frontend-api-client-template.ts)
  ↓ 调用 /api/autopaddle/*
Next.js 后端 API 路由
  ↓ 使用 backend-api-client-template.ts
AutoPaddle 云服务
```

**认证信息流转：**
1. 用户通过 SSO 登录获取认证信息
2. 前端将认证信息发送到后端（`/api/auth/set`）
3. 后端存储认证信息（session/cookie）
4. 前端调用业务 API 时，后端自动附加认证信息
5. 后端自动处理 token 刷新，前端无感知

**安全优势：**
- 认证信息不暴露在前端
- Token 由后端统一管理
- 支持服务端渲染（SSR）

---

## Mandatory Workflow: Build with PM and Reviewer

This skill **MUST** follow a two-phase workflow to ensure quality and requirement alignment:

### Phase 1: Requirement Gathering (Before Building)

**MANDATORY**: Before starting any implementation, call the `autopaddle-app-pm` skill:

```markdown
Use skill: autopaddle-app-pm

Context:
- User wants to build a new AutoPaddle Next.js application
- Need to clarify requirements before implementation

Please help clarify:
1. What type of application (dashboard, monitoring, reporting, etc.)
2. What data sources are needed (device pins, business metrics, alarms, etc.)
3. What features are required (tables, charts, filters, real-time updates, etc.)
4. What pages/components should be created
5. Any specific UX requirements or constraints
```

**What PM skill provides:**
- ✅ Structured requirement document
- ✅ Page/component specification
- ✅ Data source definitions
- ✅ Feature checklist
- ✅ UX requirements

**When to proceed:**
- Only start implementation AFTER PM skill has clarified requirements
- Use the PM's output as your specification document
- Refer to it throughout the build process

### Phase 2: Quality Assurance (After Building)

**MANDATORY**: After completing implementation, call the `autopaddle-app-reviewer` skill:

```markdown
Use skill: autopaddle-app-reviewer

Context:
- Application Path: <path-to-built-application>
- Build just completed, needs UX compliance review

Please review:
1. Direct ID interaction issues
2. Dropdown data completeness
3. ID-to-name mapping implementation
4. Time formatting with dayjs or similar
5. Frontend-backend API consistency

Expected Actions:
- Generate detailed review report
- Identify any critical or high-priority issues
- Provide fix suggestions if issues found
```

**What Reviewer skill provides:**
- ✅ Detailed audit report with file locations and line numbers
- ✅ Issue prioritization (Critical, High, Medium)
- ✅ Specific fix suggestions with code examples
- ✅ Verification of UX best practices

**When to consider build complete:**
- Only after reviewer skill confirms all critical issues are resolved
- Optionally fix high-priority issues if found
- Generate final summary report

### Complete Workflow Example

```markdown
## AutoPaddle App Building Workflow

### Step 1: Call PM Skill
[Invoke autopaddle-app-pm]

PM Output:
- App Type: Device Monitoring Dashboard
- Pages: Device List, Real-time Charts, Alarms
- Data: Device pins, alarm records, device info
- Features: Live updates, filtering, export

### Step 2: Build Application
[Implement based on PM requirements]

Example:
- pages/devices.tsx - Device list with filters
- pages/dashboard.tsx - Real-time pin charts
- pages/alarms.tsx - Alarm records with pagination
- lib/api-client.ts - API integration
- lib/influxdb-client.ts - Time-series queries

### Step 3: Call Reviewer Skill
[Invoke autopaddle-app-reviewer]

Reviewer Output:
- ✅ Passed: All dropdowns fetch complete data
- ❌ Critical: Raw timestamps not formatted
- ⚠️ High: Device filter uses ID input
- ✅ Passed: ID-to-name mapping implemented

### Step 4: Fix Issues (if any)
[Fix issues identified by reviewer]
- Import dayjs and format timestamps
- Convert device ID input to dropdown

### Step 5: Final Verification
[Re-run reviewer if fixes were made]
- All issues resolved ✅
- Build complete and approved ✅
```

### Workflow Diagram

```
User Request
     ↓
[Call autopaddle-app-pm] ← MANDATORY FIRST STEP
     ↓
Clarified Requirements
     ↓
Build Application
     ↓
[Call autopaddle-app-reviewer] ← MANDATORY FINAL STEP
     ↓
Review Report
     ↓
Issues Found?
  ↙         ↘
 YES          NO
  ↓            ↓
Fix Issues   Build Complete ✅
  ↓
Re-review
  ↓
Build Complete ✅
```

### Quality Gates

**Gate 1: Requirements Clear**
- [ ] PM skill called and requirements documented
- [ ] All questions answered
- [ ] Specification approved by user

**Gate 2: Implementation Complete**
- [ ] All required pages implemented
- [ ] Data integration working
- [ ] Features functional
- [ ] Code compiles without errors

**Gate 3: UX Compliance**
- [ ] Reviewer skill called
- [ ] No critical issues remaining
- [ ] High-priority issues addressed
- [ ] Final report generated

### Error Handling

**If PM skill encounters issues:**
- Ask user for clarification
- Re-invoke PM skill with more context
- Don't proceed until requirements are clear

**If Reviewer finds critical issues:**
- Fix all critical issues before considering build complete
- Optionally fix high-priority issues
- Re-run reviewer after fixes
- Document all changes made

### Checklist Summary

**Before Starting:**
- [ ] Called `autopaddle-app-pm` skill
- [ ] Reviewed and understood requirements
- [ ] Confirmed requirements with user

**During Implementation:**
- [ ] Following PM specification
- [ ] Using proper APIs (AutoPaddle + InfluxDB)
- [ ] Implementing UX best practices
- [ ] Testing functionality

**Before Completing:**
- [ ] Called `autopaddle-app-reviewer` skill
- [ ] Fixed all critical issues
- [ ] (Optional) Fixed high-priority issues
- [ ] Generated final summary report


