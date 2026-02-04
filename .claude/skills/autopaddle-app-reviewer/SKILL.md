---
name: autopaddle-app-reviewer
description: Reviews Next.js/React applications for UX compliance. Use when reviewing applications to ensure: (1) Users never interact directly with ID fields - use dropdowns and display name/label fields instead, (2) Dropdown options are completely fetched despite pageSize limits using multiple backend requests, (3) ID types are converted to user-friendly formats showing names/labels, (4) Time types are formatted with third-party libraries to user-friendly text, (5) Frontend API calls have corresponding backend routes with consistent parameter and response types. Generates detailed reports with file locations, line numbers, and fix suggestions. Works with various project structures (Next.js pages/app router, React SPA, custom structures).
---

# AutoPaddle App Reviewer

## Overview

Reviews AutoPaddle Next.js/React applications to ensure they meet UX best practices for ID handling, data fetching, and data formatting. Generates detailed audit reports with specific file locations, line numbers, and actionable fix suggestions.

**Project Structure Adaptability:**

This skill works with various project structures:
- **Next.js Pages Router**: `pages/`, `pages/api/`, `lib/`, `components/`
- **Next.js App Router**: `app/`, `app/api/`, `components/`, `lib/`
- **React SPA**: `src/components/`, `src/services/`, `src/utils/`
- **Custom structures**: Automatically scans for relevant files

**Key Principles:**
- Look for patterns, not specific file paths
- Adapt to the project's directory structure
- Check for common utility locations: `lib/`, `utils/`, `helpers/`, `services/`
- Support both TypeScript and JavaScript
- Work with different routing approaches

## When to Use This Skill

Use this skill when:
- Reviewing an application created by `autopaddle-nextjs-builder`
- Auditing code for direct ID usage in forms, filters, or tables
- Verifying dropdown data is completely fetched (not just first page)
- Checking ID-to-name mapping implementation
- Validating time formatting with user-friendly libraries
- Before deploying to production or handing off to users
- Reviewing any Next.js/React application with data tables and forms

## Review Workflow

### Step 1: Scan Application Structure

Identify all pages and components that need review:

**For Next.js projects:**
```bash
# Find all page files (adjust path based on routing: pages/ or app/)
find . -path "*/pages/**/*.{tsx,jsx,ts,js}" -o -path "*/app/**/*.{tsx,jsx,ts,js}"

# Find all component files
find . -path "*/components/**/*.{tsx,jsx}" -o -path "*/src/components/**/*.{tsx,jsx}"

# Check for API route handlers
find . -path "*/pages/api/**/*.{ts,js}" -o -path "*/app/api/**/*.{ts,js}"

# Find utility/helper files
find . -path "*/lib/**/*.{ts,js}" -o -path "*/utils/**/*.{ts,js}" -o -path "*/helpers/**/*.{ts,js}"
```

**For React projects:**
```bash
# Find all component files
find . -path "*/src/**/*.{tsx,jsx}" -not -path "*/node_modules/*"

# Check for API/service files
find . -path "*/services/**/*.{ts,js}" -o -path "*/api/**/*.{ts,js}"
```

**What to look for:**
- List/form/table components that display or input data
- Components with ID fields (deviceId, shiftId, functionId, userId, etc.)
- Components with date/time fields
- API calls that fetch dropdown or reference data
- Data fetching utilities and helpers

### Step 2: Check for Direct ID Interaction

Review forms and filters for direct ID usage:

**Common ID fields to check** (varies by application domain):
- Entity IDs: `deviceId`, `userId`, `productId`, `orderId`, `customerId`
- Reference IDs: `shiftId`, `functionId`, `domainId`, `categoryId`, `typeId`
- Business IDs: `businessId`, `departmentId`, `locationId`, `projectId`
- Any field ending with `Id`, `ID`, or `_id` that users shouldn't see directly

**Where to check:**
- Form inputs (search filters, add/edit forms)
- Table columns and list displays
- Dropdown options
- URL parameters (if visible to users)
- Detail views or pages

**Problematic patterns to find:**
```typescript
// ❌ BAD: Direct ID input
<input type="number" value={deviceId} onChange={...} />
<input placeholder="Enter device ID" />

// ❌ BAD: ID display in tables
<td>{report.deviceId}</td>
<td>Device #{item.deviceId}</td>

// ❌ BAD: ID in dropdown value without label
<select value={filters.deviceId}>
  <option value="1">1</option>
  <option value="2">2</option>
</select>
```

**Correct patterns:**
```typescript
// ✅ GOOD: Device name dropdown
<select value={filters.deviceId}>
  <option value="">All Devices</option>
  {devices.map(device => (
    <option key={device.id} value={device.id.toString()}>
      {device.deviceName}
    </option>
  ))}
</select>

// ✅ GOOD: ID to name mapping
{devices.find(d => d.id === item.deviceId)?.deviceName || `Device #${item.deviceId}`}

// ✅ GOOD: Fetched device name display
<td>{item.deviceName || devices.find(d => d.id === item.deviceId)?.deviceName}</td>
```

### Step 3: Verify Complete Dropdown Data Fetching

Check that dropdowns fetch all data, not just first page:

**Problematic patterns:**
```typescript
// ❌ BAD: Only fetches first page
const [devices, setDevices] = useState([]);
useEffect(() => {
  fetch('/api/devices?page=1&pageSize=10')
    .then(res => res.json())
    .then(data => setDevices(data.data.list));
}, []);
```

**Correct patterns:**
```typescript
// ✅ GOOD: Fetches all pages via helper function
// Import path may vary: ../lib/fetchHelper, ../../utils/api, etc.
import { fetchAllDevices } from '../lib/fetchHelper';
// or
import { fetchAllDevices } from '@/utils/api';

useEffect(() => {
  fetchDevices();
}, []);

const fetchDevices = async () => {
  const allDevices = await fetchAllDevices(); // Handles pagination internally
  setDevices(allDevices);
};
```

**Check for pagination helper in utility files:**
- Look in `lib/`, `utils/`, `helpers/`, or `services/` directories
- Common file names: `fetchHelper.ts`, `api.ts`, `dataService.ts`, `apiClient.ts`
- Look for functions named: `fetchAllItems`, `fetchAll`, `fetchPaginated`, etc.

**Verify pagination loop implementation:**
```typescript
// ✅ GOOD: Pagination loop in utility file
// Location: lib/fetchHelper.ts, utils/api.ts, or similar
export async function fetchAllItems<T>(url: string, pageSize = 100): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);

    if (!response.ok) {
      console.warn(`API ${url} returned ${response.status}, stopping pagination`);
      break;
    }

    const data = await response.json();
    if (data.code === 0) {  // Check success status
      const list = data.data.list || [];
      allItems.push(...list);

      if (allItems.length >= data.data.total || list.length === 0) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }
  return allItems;
}
```

### Step 4: Review ID-to-Name Mapping Implementation

Ensure IDs are converted to user-friendly labels:

**Check display logic:**
```typescript
// ✅ GOOD: Three-tier fallback
const itemName = item.name ||
  items.find(i => i.id === item.itemId)?.name ||
  `Item #${item.itemId}`;

// ✅ GOOD: Auto-enrich fetched data
const listWithNames = data.data.list.map((report) => ({
  ...report,
  deviceName: report.deviceName ||
    devices.find(d => d.id === report.deviceId)?.deviceName ||
    `Device #${report.deviceId}`
}));
```

**Check API usage for name fetching:**
- Are detail APIs called when names are missing?
- Are batch/pagination APIs used to fetch reference data?
- Is there caching to avoid repeated API calls?

### Step 5: Validate Time Formatting

Check that timestamps are user-friendly:

**Supported time libraries:**
- **dayjs** (recommended): Lightweight, similar API to Moment.js
- **date-fns**: Modular, tree-shakeable utilities
- **luxon**: Modern, powerful API from Moment.js team
- **moment.js**: Legacy (not recommended for new projects)

**Common time field names** (varies by application):
- `createTime`, `createdAt`, `created_at` - Creation timestamp
- `updateTime`, `updatedAt`, `updated_at` - Last update timestamp
- `timestamp` - Generic timestamp field
- `date`, `time`, `dateTime` - Various date/time fields
- `alarmTime`, `eventTime`, `startTime`, `endTime` - Domain-specific times

**Check package.json for time libraries:**
```json
{
  "dependencies": {
    "dayjs": "^1.11.19",     // ✅ Recommended
    "date-fns": "^2.30.0",   // ✅ Good alternative
    "luxon": "^3.4.0"        // ✅ Good alternative
  }
}
```

**Problematic patterns:**
```typescript
// ❌ BAD: Raw timestamp display
<td>{report.createTime}</td>
<span>{item.timestamp}</span>

// ❌ BAD: Manual formatting
{new Date(item.createTime).toLocaleDateString()}
```

**Correct patterns:**
```typescript
// ✅ GOOD: Using dayjs (recommended)
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';  // Or other locales

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// Absolute format
<td>{dayjs(report.createTime).format('YYYY-MM-DD HH:mm:ss')}</td>
<span>{dayjs(item.timestamp).fromNow()}</span>  // "2 hours ago"

// ✅ GOOD: Using date-fns
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

<td>{format(new Date(report.createTime), 'yyyy-MM-dd HH:mm:ss')}</td>
<span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: zhCN })}</span>

// ✅ GOOD: Using luxon
import { DateTime } from 'luxon';

<td>{DateTime.fromISO(report.createTime).toFormat('yyyy-MM-dd HH:mm:ss')}</td>
<span>{DateTime.fromISO(item.timestamp).toRelative()}</span>
```

### Step 6: Generate Review Report

Compile findings into a structured report:

```markdown
# AutoPaddle App Review Report

## Summary
- **Files Reviewed**: X
- **Issues Found**: Y
- **Critical**: Z
- **Warnings**: W
- **Passed Checks**: V

## Critical Issues

### 1. Direct ID Input in Filter/Form
**File**: `<path-to-component-file>:<line_number>`
**Issue**: Users input ID directly via number/text input instead of dropdown selection
**Current**:
```typescript
<input type="number" value={filters.deviceId} />
// or
<input type="text" placeholder="Enter ID" />
```
**Suggested Fix**:
```typescript
<select value={filters.deviceId}>
  <option value="">All Items</option>
  {items.map(item => (
    <option key={item.id} value={item.id.toString()}>
      {item.name}  {/* or itemName, displayName, label, etc. */}
    </option>
  ))}
</select>
```

### 2. Incomplete Dropdown Data Fetching
**File**: `<path-to-component-file>:<line_number>`
**Issue**: Only fetches first page of data, not all available items
**Current**: Fetches with `pageSize=10` (or similar small limit) without pagination loop
**Suggested Fix**:
- Create/use `fetchAllItems()` or similar helper function that loops through all pages
- Import from utility file: `import { fetchAllItems } from '<utils-path>';`
- Update useEffect to call the helper instead of raw fetch()

## Warnings

### 1. Raw Timestamp Display
**File**: `<path-to-component-file>:<line_number>`
**Issue**: Shows raw ISO timestamp instead of user-friendly formatted date
**Current**: `{item.timestamp}` or `{item.createTime}` displays as "2024-01-30T10:30:00.000Z"
**Suggested Fix**:
```typescript
import dayjs from 'dayjs';
{dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
// or for relative time:
{dayjs(item.timestamp).fromNow()}  // "5 minutes ago"
```

## Passed Checks

✅ All entity IDs properly mapped to names/labels in table displays
✅ Dropdown data fetched completely using pagination helper
✅ Time formatting implemented using dayjs or similar library
✅ No direct ID inputs found in forms or filters
```

### Step 7: Fix Issues Using AutoPaddle Builder

After generating the review report and identifying issues, use the `autopaddle-nextjs-builder` skill to automatically fix the identified problems:

**When to use this step:**
- After completing the review and generating the report
- When critical or high-priority issues are found
- When the user confirms they want the issues fixed

**How to invoke the builder:**

1. **Summarize the issues** - Prepare a concise summary of all issues found, organized by priority:

```
ISSUES SUMMARY:
Critical:
1. [Issue description] - File: path/to/file.tsx:line_number
2. [Issue description] - File: path/to/file.tsx:line_number

High Priority:
3. [Issue description] - File: path/to/file.tsx:line_number

Medium Priority:
4. [Issue description] - File: path/to/file.tsx:line_number
```

2. **Call the autopaddle-nextjs-builder skill** with the application path and issue summary:

```
Use skill: autopaddle-nextjs-builder

Context:
- Application Path: /path/to/autopaddle-app
- Task: Fix UX issues identified in review

Issues to Fix:
[Paste the issues summary here]

Expected Actions:
1. Import and configure dayjs in all pages
2. Replace raw timestamps with formatted dates
3. Convert text inputs to dropdown selects for ID fields
4. Ensure all dropdown data is fetched completely
5. Add ID-to-name mappings where missing
6. Test all changes to ensure functionality
```

**What the builder will do:**

The `autopaddle-nextjs-builder` skill will:
- ✅ Add dayjs imports to all relevant pages
- ✅ Replace raw timestamp displays with `dayjs().format()`
- ✅ Convert direct ID inputs to dropdown selects
- ✅ Implement or fix `fetchAllItems()` helper functions
- ✅ Add three-tier fallback ID-to-name mappings
- ✅ Update filter states to use dropdowns instead of text inputs
- ✅ Ensure all data fetching uses pagination loops

**Example workflow:**

```markdown
## Review Complete - 3 Issues Found

### Issues:
1. ❌ **Critical**: Raw timestamps in all pages (dayjs installed but not used)
   - Files: pages/list.tsx, pages/detail.tsx, components/DataTable.tsx
2. ⚠️ **High**: Entity filter uses text input instead of dropdown
   - File: components/FilterForm.tsx:45
3. ⚠️ **Medium**: Dropdown data only fetches first page
   - File: pages/dashboard.tsx:78

### Next Step:
Would you like me to use the autopaddle-nextjs-builder skill to automatically fix these issues?

[If user confirms]
Invoking autopaddle-nextjs-builder skill to fix:
- Import dayjs and format all timestamps across all pages
- Convert entity text input to dropdown with fetchAllEntities()
- Implement complete pagination data fetching for all dropdowns
```

**Verification after fixes:**

After the builder completes the fixes, the reviewer should:
1. Re-scan the modified files
2. Verify all critical issues are resolved
3. Generate a follow-up report confirming fixes
4. Run the application to test functionality

## Resources

### references/

Detailed reference documentation for specific review scenarios:

- **review-checklist.md**: Complete checklist of all review points with examples
- **common-issues.md**: Catalog of common issues found in AutoPaddle apps with fixes

Load these when performing detailed reviews or when you need specific guidance on an issue.
