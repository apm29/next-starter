# Data Query Patterns

## Session-Based Query Pattern

AutoPaddle cloud APIs use a two-step session-based pattern for querying InfluxDB data.

### Pattern Overview

1. **Initiate Query** - Send query parameters, receive sessionId
2. **Poll for Results** - Use sessionId to retrieve results (may need multiple attempts)

### Implementation Example

```javascript
async function queryBusinessData(ids, startTime, endTime) {
  // Step 1: Initiate query
  const initResponse = await fetch(
    'https://gateway.autopaddle.com/admin-api/device/domain-function/searchHistoryDataById',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Tenant-ID': tenantId,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `ids=${ids}&startTime=${startTime}&endTime=${endTime}`
    }
  );

  const { data: sessionId } = await initResponse.json();

  // Step 2: Poll for results
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const resultResponse = await fetch(
      'https://gateway.autopaddle.com/admin-api/device/domain-function/getDataBySessionId',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Tenant-ID': tenantId,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `sessionId=${sessionId}`
      }
    );

    const result = await resultResponse.json();

    if (result.code === 0 && result.data?.flux) {
      return result.data.flux;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error('Query timeout');
}
```

## Query Type Patterns

### Latest Business Data

```javascript
// Initiate
POST /admin-api/device/domain-function/searchDataById
Body: ids=401,402,403

// Poll
POST /admin-api/device/domain-function/getDataBySessionId
Body: sessionId=xxx

// Result structure
{
  "flux": {
    "401": [{ "_measurement": "...", "_value": 1, "_time": "..." }],
    "402": [{ "_measurement": "...", "_value": 633, "_time": "..." }]
  }
}
```

### Historical Business Data

```javascript
// Initiate
POST /admin-api/device/domain-function/searchHistoryDataById
Body: ids=401,402&startTime=2026-01-30 08:00:00&endTime=2026-01-30 09:00:00

// Poll (same as latest)
// Result: Array of time-series data points per ID
```

### Device Pin Aggregation Data

```javascript
// Initiate
POST /admin-api/device/domain-function/searchDevicePinAggregationDataById
Body: sessionId=xxx&startTime=...&endTime=...&queryDeviceDomainPinIds=[{"deviceDomainId":839,"deviceDomainPinIds":"25386,25387"}]

// Poll
POST /admin-api/device/domain-function/getSyncSearchDataBySessionId
Body: sessionId=xxx

// Result structure
{
  "flux": {
    "row": [
      {
        "_field": "BASEXXX_pinId",
        "_measurement": "BASEXXX",
        "_value": 1,
        "_time": "2026-01-30T01:11:28Z"
      }
    ]
  }
}
```

## Error Handling

### Token Expiration

```javascript
async function fetchWithTokenRefresh(url, options) {
  let response = await fetch(url, options);
  let data = await response.json();

  if (data.code === 401) {
    // Refresh token
    const refreshResponse = await fetch(
      `https://gateway.autopaddle.com/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Tenant-ID': tenantId
        }
      }
    );

    const refreshData = await refreshResponse.json();
    accessToken = refreshData.data.accessToken;

    // Retry original request
    options.headers['Authorization'] = `Bearer ${accessToken}`;
    response = await fetch(url, options);
    data = await response.json();
  }

  return data;
}
```

### Query Timeout

```javascript
const POLL_INTERVAL = 1000; // 1 second
const MAX_ATTEMPTS = 30; // 30 seconds total

// Implement exponential backoff for long-running queries
const backoff = Math.min(1000 * Math.pow(1.5, attempts), 5000);
await new Promise(resolve => setTimeout(resolve, backoff));
```
