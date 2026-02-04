# Common Issues in AutoPaddle Apps

Catalog of frequently found issues in AutoPaddle applications with detailed fix examples.

## Issue 1: Direct ID Input in Filters

### 📍 Location
`pages/alarms.tsx:162`, `pages/reports.tsx:178`

### 🔍 Problem
Users must manually enter device IDs or other IDs, creating poor UX.

```typescript
// ❌ BAD
<input
  type="number"
  placeholder="Enter device ID"
  value={filters.deviceId}
  onChange={(e) => setFilters({...filters, deviceId: e.target.value})}
/>
```

### ✅ Fix
Replace with dropdown populated from fetched data:

```typescript
// ✅ GOOD
<select
  value={filters.deviceId}
  onChange={(e) => setFilters({...filters, deviceId: e.target.value})}
>
  <option value="">All Devices</option>
  {devices.map(device => (
    <option key={device.id} value={device.id.toString()}>
      {device.deviceName}
    </option>
  ))}
</select>
```

### Implementation Notes
- Fetch device list on component mount
- Store in state: `const [devices, setDevices] = useState([])`
- Use helper: `const fetchDevices = async () => { const allDevices = await fetchAllDevices(); setDevices(allDevices); }`

---

## Issue 2: Raw ID Display in Tables

### 📍 Location
`pages/alarms.tsx:289`, `pages/business.tsx:234`

### 🔍 Problem
Table shows numeric IDs that are meaningless to users.

```typescript
// ❌ BAD
<td>{report.deviceId}</td>
<td>{config.functionId}</td>
```

### ✅ Fix
Display names with fallback to ID:

```typescript
// ✅ GOOD
<td>{report.deviceName || devices.find(d => d.id === report.deviceId)?.deviceName || `Device #${report.deviceId}`}</td>
<td>{config.functionName || functions.find(f => f.id === config.functionId)?.functionName || `Function #${config.functionId}`}</td>
```

### Implementation Notes
- Three-tier fallback: backend data → local cache → formatted ID
- Use optional chaining to prevent crashes: `items.find()?.name`
- Consider fetching names in API if backend doesn't provide them

---

## Issue 3: Incomplete Dropdown Data (Pagination)

### 📍 Location
`pages/alarms.tsx:64`, `pages/reports.tsx:68`

### 🔍 Problem
Only first page of data fetched, missing items in dropdowns.

```typescript
// ❌ BAD
useEffect(() => {
  fetch('/api/devices?page=1&pageSize=10')
    .then(res => res.json())
    .then(data => setDevices(data.data.list));
}, []);
```

### ✅ Fix
Use pagination helper that fetches all pages:

```typescript
// ✅ GOOD
import { fetchAllDevices } from '../lib/fetchHelper';

useEffect(() => {
  fetchDevices();
}, []);

const fetchDevices = async () => {
  try {
    const allDevices = await fetchAllDevices();
    setDevices(allDevices);
  } catch (error) {
    console.error('Failed to fetch devices:', error);
  }
};
```

### Create Helper Function
Create `lib/fetchHelper.ts`:

```typescript
export async function fetchAllItems<T>(url: string, pageSize: number = 100): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        console.warn(`API ${url} returned ${response.status}, stopping pagination`);
        break;
      }

      const data = await response.json();
      if (data.code === 0) {
        const list = data.data.list || [];
        allItems.push(...list);

        const totalFetched = allItems.length;
        const total = data.data.total;

        if (totalFetched >= total || list.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  return allItems;
}

export async function fetchAllDevices(): Promise<any[]> {
  return fetchAllItems('/api/devices');
}

export async function fetchAllDeviceFunctions(): Promise<any[]> {
  return fetchAllItems('/api/business');
}
```

---

## Issue 4: Raw Timestamp Display

### 📍 Location
`pages/business.tsx:245`, `pages/alarms.tsx:312`

### 🔍 Problem
ISO timestamps shown directly to users.

```typescript
// ❌ BAD
<td>{report.createTime}</td>
<span>{alarm.timestamp}</span>
```

### ✅ Fix
Use dayjs for user-friendly formatting:

```typescript
// ✅ GOOD
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Absolute format for precise times
<td>{dayjs(report.createTime).format('YYYY-MM-DD HH:mm:ss')}</td>

// Relative format for recent items
<span>{dayjs(alarm.timestamp).fromNow()}</span>  // "5 minutes ago"
```

### Install dayjs
```bash
npm install dayjs
```

### Common Formats
```typescript
// Date only
{dayjs(item.reportDate).format('YYYY-MM-DD')}

// Date and time
{dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')}

// Relative time
{dayjs(item.timestamp).fromNow()}  // "2 hours ago"

// Custom format
{dayjs(item.date).format('MM/DD/YYYY')}
```

---

## Issue 5: Missing ID-to-Name Enrichment

### 📍 Location
`pages/alarms.tsx:89`, `pages/reports.tsx:92`

### 🔍 Problem
API returns only IDs, frontend doesn't enrich with names.

```typescript
// ❌ BAD
const [configs, setConfigs] = useState([]);
useEffect(() => {
  fetch('/api/alarms/configs')
    .then(res => res.json())
    .then(data => setConfigs(data.data.list));
}, []);

// Later in render:
<td>{config.deviceId}</td>  // Shows ID!
```

### ✅ Fix
Enrich data with names after fetching:

```typescript
// ✅ GOOD
const [configs, setConfigs] = useState([]);
const [devices, setDevices] = useState([]);

// Fetch both configs and devices
useEffect(() => {
  Promise.all([
    fetch('/api/alarms/configs').then(r => r.json()),
    fetchAllDevices()
  ]).then(([configsData, devicesData]) => {
    const enrichedConfigs = configsData.data.list.map(config => ({
      ...config,
      deviceName: devicesData.find(d => d.id === config.deviceId)?.deviceName
    }));
    setConfigs(enrichedConfigs);
    setDevices(devicesData);
  });
}, []);

// Later in render:
<td>{config.deviceName || `Device #${config.deviceId}`}</td>
```

---

## Issue 6: No Error Handling for Missing APIs

### 📍 Location
`pages/reports.tsx:72`, `lib/fetchHelper.ts:36`

### 🔍 Problem
Application crashes when API endpoint doesn't exist.

```typescript
// ❌ BAD
const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);
const data = await response.json();  // Crashes on 404
```

### ✅ Fix
Check response status before parsing:

```typescript
// ✅ GOOD
const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);

if (!response.ok) {
  console.warn(`API ${url} returned ${response.status}, stopping pagination`);
  hasMore = false;
  break;
}

const data = await response.json();
```

---

## Issue 7: Using Wrong API Endpoint

### 📍 Location
`pages/reports.tsx:72`

### 🔍 Problem
Trying to fetch data from non-existent endpoint.

```typescript
// ❌ BAD
const fetchShifts = async () => {
  const allShifts = await fetchAllShifts();  // API doesn't exist!
  setShifts(allShifts);
};
```

### ✅ Fix
Remove the non-existent API call and use text input instead:

```typescript
// ✅ GOOD
// Don't fetch shifts, use text input for filtering
<div>
  <label>Shift Name</label>
  <input
    type="text"
    placeholder="Enter shift name"
    value={filters.shiftName}
    onChange={(e) => setFilters({...filters, shiftName: e.target.value})}
  />
</div>
```

---

## Issue 8: Dropdown Shows IDs as Options

### 📍 Location
`pages/alarms.tsx:168`

### 🔍 Problem
Dropdown options show IDs instead of names.

```typescript
// ❌ BAD
<select value={filters.deviceId}>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
</select>
```

### ✅ Fix
Map options to show names with IDs as values:

```typescript
// ✅ GOOD
<select value={filters.deviceId}>
  <option value="">All Devices</option>
  {devices.map(device => (
    <option key={device.id} value={device.id.toString()}>
      {device.deviceName}
    </option>
  ))}
</select>
```

---

## Summary of Fix Patterns

### 1. Dropdown Pattern
```typescript
// Fetch data
const [items, setItems] = useState([]);
useEffect(() => {
  const fetchItems = async () => {
    const allItems = await fetchAllItems();
    setItems(allItems);
  };
  fetchItems();
}, []);

// Render dropdown
<select value={selectedId}>
  <option value="">All Items</option>
  {items.map(item => (
    <option key={item.id} value={item.id.toString()}>
      {item.name}
    </option>
  ))}
</select>
```

### 2. Display Pattern
```typescript
// With fallback
{item.name || items.find(i => i.id === item.itemId)?.name || `Item #${item.itemId}`}

// Auto-enrich fetched data
const enrichedData = rawData.map(item => ({
  ...item,
  itemName: items.find(i => i.id === item.itemId)?.name
}));
```

### 3. Time Pattern
```typescript
import dayjs from 'dayjs';

{dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
{dayjs(item.timestamp).fromNow()}  // Relative
```

### 4. Pagination Pattern
```typescript
export async function fetchAllItems(url) {
  const allItems = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${url}?page=${page}&pageSize=100`);
    if (!response.ok) break;

    const data = await response.json();
    allItems.push(...data.data.list);

    if (allItems.length >= data.data.total || data.data.list.length === 0) break;
    page++;
  }

  return allItems;
}
```
