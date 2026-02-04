# AutoPaddle API Reference

## Authentication

### Headers Required

All API requests must include:

```javascript
{
  'Authorization': `Bearer ${accessToken}`,
  'Tenant-ID': tenantId
}
```

### Token Refresh

When receiving 401 response, refresh the access token:

```javascript
const response = await fetch(
  `https://gateway.autopaddle.com/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Tenant-ID': tenantId
    }
  }
);
const data = await response.json();
const newAccessToken = data.data.accessToken;
```

## Response Formats

### Standard Response

```json
{
  "code": 0,
  "data": "...",
  "msg": ""
}
```

### Paginated Response

```json
{
  "code": 0,
  "data": {
    "list": [...],
    "total": 100
  },
  "msg": ""
}
```

### Error Response (Token Expired)

```json
{
  "code": 401,
  "data": null,
  "msg": "Token已过期"
}
```

## Data Query APIs

### Business Data (Latest)

**Initiate Query:**
- Endpoint: `/admin-api/device/domain-function/searchDataById`
- Method: POST
- Body: `ids` (comma-separated business IDs)

**Get Results:**
- Endpoint: `/admin-api/device/domain-function/getDataBySessionId`
- Method: POST
- Body: `sessionId`

Response format:
```json
{
  "code": 0,
  "data": {
    "flux": {
      "401": [{
        "_measurement": "BUSINESS4F625C861267497E85791CE0D5AAD965",
        "_value": 1,
        "id": 401,
        "_time": "2026-01-30 09:01:27"
      }]
    }
  }
}
```

### Business Data (Historical)

**Initiate Query:**
- Endpoint: `/admin-api/device/domain-function/searchHistoryDataById`
- Method: POST
- Body: `ids`, `startTime`, `endTime`

**Get Results:**
- Same as latest data query

### Device Pin Data (Latest)

**Initiate Query:**
- Endpoint: `/admin-api/device/domain-function/searchDevicePinAggregationDataById`
- Method: POST
- Body: `sessionId`, `startTime`, `endTime`, `queryDeviceDomainPinIds`

Example body:
```
sessionId=xxx&startTime=2026-01-30%2008%3A41%3A52&endTime=2026-01-30%2009%3A11%3A52&queryDeviceDomainPinIds=[{"deviceDomainId":839,"deviceDomainPinIds":"25386,25387,25391"}]
```

**Get Results:**
- Endpoint: `/admin-api/device/domain-function/getSyncSearchDataBySessionId`
- Method: POST
- Body: `sessionId`

Response format:
```json
{
  "code": 0,
  "data": {
    "flux": {
      "row": [
        {
          "_field": "BASEB4BB734B197943DBA1C8B200E911480A_K17TBDyR",
          "_measurement": "BASEB4BB734B197943DBA1C8B200E911480A",
          "_value": 1,
          "_time": "2026-01-30T01:11:28Z"
        }
      ]
    }
  }
}
```
