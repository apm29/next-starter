# AutoPaddle App Review Checklist

Complete checklist for reviewing AutoPaddle applications. Use this to systematically verify all UX requirements.

## 1. Direct ID Interaction Check ✅

### Forms and Filters
- [ ] No `<input type="number">` fields for ID entry
- [ ] No text inputs with "Enter ID" placeholders
- [ ] All ID selections use dropdowns with name/label display
- [ ] Filter dropdowns show meaningful names, not IDs

### Tables and Lists
- [ ] No table cells display raw IDs (e.g., `<td>{item.deviceId}</td>`)
- [ ] All ID columns show corresponding names/labels
- [ ] Fallback format used: `Device #ID` or `Item #ID` when name unavailable
- [ ] ID tooltips or subtitles acceptable if name is primary display

### Dropdown Options
- [ ] All `<option>` elements display names, not IDs
- [ ] Option values may be IDs, but visible text must be names
- [ ] Example: `<option value="123">Device Name</option>` ✅

## 2. Complete Dropdown Data Fetching ✅

### Pagination Implementation
- [ ] Check for `fetchAllItems()` or similar helper function
- [ ] Helper function implements while loop for pagination
- [ ] Loop condition checks: `totalFetched >= total` or `list.length === 0`
- [ ] Page counter increments: `page++` inside loop
- [ ] Error handling for failed responses (`response.ok` check)

### Backend API Routes
- [ ] `pageSize` parameter set to reasonable value (100-500)
- [ ] Multiple requests made until all data retrieved
- [ ] Accumulated results stored in array
- [ ] No hardcoded `page=1` limits

### Frontend Component Usage
- [ ] `useEffect` calls fetch helper (not raw `fetch()`)
- [ ] No `pageSize=10` or similar small limits in component code
- [ ] State stores complete results, not just first page
- [ ] Dropdowns iterate over complete dataset

### Code Pattern Examples

**Check for this pattern:**
```typescript
export async function fetchAllItems<T>(url: string, pageSize = 100): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);
    if (!response.ok) break;

    const data = await response.json();
    allItems.push(...data.data.list);

    if (allItems.length >= data.data.total || list.length === 0) {
      hasMore = false;
    } else {
      page++;
    }
  }
  return allItems;
}
```

## 3. ID-to-Name Mapping ✅

### Display Logic
- [ ] Three-tier fallback implemented:
  1. Backend-provided name
  2. Locally cached name from array
  3. Fallback to `#ID` format
- [ ] Optional chaining used: `items.find(i => i.id === item.itemId)?.name`
- [ ] No undefined or null displays for names

### Data Fetching
- [ ] Reference data fetched before display (devices, shifts, etc.)
- [ ] Batch APIs used when available
- [ ] Detail APIs called for individual items when needed
- [ ] Caching implemented to avoid redundant calls

### Auto-Enrichment Pattern
- [ ] Fetched data enriched with names:
```typescript
const listWithNames = data.data.list.map((item) => ({
  ...item,
  itemName: item.itemName ||
    items.find(i => i.id === item.itemId)?.itemName ||
    `Item #${item.itemId}`
}));
```

## 4. Time Formatting ✅

### Library Usage
- [ ] Time library installed (dayjs, date-fns, luxon, etc.)
- [ ] No raw `new Date().toLocaleDateString()` calls
- [ ] No direct timestamp displays: `{item.timestamp}`

### Display Formats
- [ ] Absolute time: `YYYY-MM-DD HH:mm:ss` or similar
- [ ] Relative time: "2 hours ago" for recent items
- [ ] User-friendly format matching locale
- [ ] Consistent format across application

### dayjs Usage Check
```typescript
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Absolute format
{dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')}

// Relative format
{dayjs(item.timestamp).fromNow()}  // "5 minutes ago"
```

## 5. Frontend-Backend API Consistency Check ✅

### API Route Existence
- [ ] Every frontend fetch() call has corresponding backend route
- [ ] No 404 errors when frontend calls API endpoints
- [ ] Backend route file exists for each frontend API call
- [ ] Route paths match between frontend and backend

### Request Parameter Consistency
- [ ] Query parameters match backend expectations
  - `page`, `pageSize` for pagination
  - Filter parameters (deviceId, shiftId, etc.)
  - Date/time formats consistent
- [ ] Request body structure matches backend parsing
- [ ] Parameter types match (string vs number, etc.)
- [ ] Required parameters always provided

### Response Data Consistency
- [ ] Response structure matches frontend expectations
  - `data.data.list` pattern consistent
  - `data.code` and `data.msg` present
- [ ] Field names match between frontend and backend
  - `deviceId` not `device_id` or `DeviceId`
  - Consistent camelCase or snake_case
- [ ] Data types match (strings, numbers, dates)
- [ ] Nested object structure consistent

### Type Safety Verification
- [ ] TypeScript interfaces defined for API responses
- [ ] Request payload types defined
- [ ] No `any` types used for critical data
- [ ] Type definitions match actual API responses

### Common Issues to Check

**Frontend-Backend Mismatches:**
```typescript
// ❌ BAD: Field name mismatch
// Frontend expects: { deviceName: string }
// Backend returns: { device_name: string }

// ❌ BAD: Structure mismatch
// Frontend expects: data.data.list
// Backend returns: data.items

// ❌ BAD: Type mismatch
// Frontend sends: deviceId: number
// Backend expects: deviceId: string
```

**Correct Implementation:**
```typescript
// ✅ GOOD: Consistent field names
interface Device {
  id: number;
  deviceName: string;  // camelCase consistent
  deviceId: string;
  createTime: string;
}

// ✅ GOOD: Consistent structure
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: {
    list: T[];
    total: number;
  };
}

// ✅ GOOD: Type-safe API calls
const response = await fetch('/api/devices?page=1&pageSize=10');
const data: ApiResponse<Device> = await response.json();
```

### Verification Steps

1. **Map All Frontend API Calls**
   - Search for `fetch(`, `axios.get(`, `api.` in all page files
   - List all API endpoints called
   - Document expected parameters and responses

2. **Verify Backend Implementation**
   - Check `pages/api/` directory for route files
   - Verify each route exists and is implemented
   - Match route handlers to frontend calls

3. **Cross-Reference Parameters**
   - Compare query parameters sent vs. expected
   - Check request body structure
   - Verify data type compatibility

4. **Validate Response Structure**
   - Inspect actual API responses
   - Compare with frontend usage
   - Check for optional/null fields

### Example Check Workflow

```typescript
// Step 1: Find frontend API call
// pages/devices.tsx
const response = await fetch('/api/devices?page=1&pageSize=10');
const data = await response.json();
setDevices(data.data.list);

// Step 2: Verify backend route exists
// pages/api/devices.ts ✅
export default async function handler(req, res) {
  const { page, pageSize } = req.query;
  // ... implementation
}

// Step 3: Check parameter consistency
// Frontend sends: page=1, pageSize=10 (strings)
// Backend expects: page, pageSize (can parse as ints) ✅

// Step 4: Validate response structure
// Frontend expects: data.data.list
// Backend returns: { code: 0, data: { list: [...], total: 100 } } ✅
```

### Common Mismatch Patterns

**Pagination Parameters:**
```typescript
// ❌ Mismatch: Frontend sends string, backend expects number
fetch('/api/devices?page=1')  // "1"
// Backend: parseInt(page) or receives string

// ✅ Consistent: Both handle string conversion
fetch('/api/devices?page=1')
// Backend: const page = parseInt(req.query.page) || 1;
```

**Date Formats:**
```typescript
// ❌ Mismatch: Different date formats
// Frontend: '2024-01-30'
// Backend: expects ISO string '2024-01-30T00:00:00.000Z'

// ✅ Consistent: Same format
// Frontend: dayjs().format('YYYY-MM-DD')
// Backend: Accepts 'YYYY-MM-DD' or handles conversion
```

**Response Field Names:**
```typescript
// ❌ Mismatch: Inconsistent naming
// Frontend: device.deviceName
// Backend: { device_name: '...' }

// ✅ Consistent: Same naming convention
// Frontend: device.deviceName
// Backend: { deviceName: '...' }
```

## 6. Common File Locations to Check

### Pages
- `pages/index.tsx` - Homepage
- `pages/devices.tsx` - Device list
- `pages/alarms.tsx` - Alarm configurations/records
- `pages/business.tsx` - Business functions
- `pages/reports.tsx` - Daily reports

### Components
- `components/Table.tsx` - Reusable tables
- `components/FilterForm.tsx` - Filter forms
- `components/DeviceSelect.tsx` - Device dropdowns

### API Routes
- `pages/api/devices.ts` - Device endpoints
- `pages/api/business.ts` - Business function endpoints
- `pages/api/reports/daily.ts` - Report endpoints
- `pages/api/alarms/config.ts` - Alarm config endpoints
- `pages/api/alarms/records.ts` - Alarm record endpoints

### Utilities
- `lib/fetchHelper.ts` - Pagination helpers
- `lib/api-client.ts` - API client with type definitions
- `lib/formatUtils.ts` - Time formatting utilities

## 7. Quick Reference

### IDs That Commonly Need Names
- `deviceId` → `deviceName`
- `shiftId` → `shiftName`
- `functionId` → `functionName` / `businessName`
- `domainId` → `deviceName` / `domainName`
- `userId` → `userName`

### Time Fields to Format
- `createTime` - Creation timestamp
- `updateTime` - Last update timestamp
- `reportDate` - Report date
- `alarmTime` - Alarm occurrence time
- `timestamp` - Generic timestamp

### Red Flag Patterns
```typescript
// ❌ Direct ID display
<td>{item.deviceId}</td>

// ❌ ID input
<input type="number" value={deviceId} />

// ❌ Single page fetch
fetch('/api/devices?page=1&pageSize=10')

// ❌ Raw timestamp
<span>{item.createTime}</span>
```

### Green Flag Patterns
```typescript
// ✅ Name display with fallback
<td>{item.deviceName || devices.find(d => d.id === item.deviceId)?.deviceName || `Device #${item.deviceId}`}</td>

// ✅ Dropdown with names
<select value={deviceId}>
  {devices.map(d => <option key={d.id} value={d.id}>{d.deviceName}</option>)}
</select>

// ✅ Complete fetch
const allDevices = await fetchAllDevices();

// ✅ Formatted time
<td>{dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}</td>
```
