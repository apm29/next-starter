# InfluxDB Integration Guide

## Connection Configuration

```javascript
import { InfluxDB } from '@influxdata/influxdb-client';

const influxDB = new InfluxDB({
  url: `http://${process.env.GATEWAY_IP || 'localhost'}:18086`,
  token: 'autopaddle-api-token'
});

const queryApi = influxDB.getQueryApi('autopaddle');
```

## Data Model

### Measurement Naming

**Device Data:**
- Format: `BASE` + 32-character hash
- Example: `BASE00479D607F9B4F8F9204EC0F1F04B177`

**Business Data:**
- Format: `BUSINESS` + 32-character hash
- Example: `BUSINESS00479D607F9B4F8F9204EC0F1F04B177`

### Field Naming

**Device Pin Fields:**
- Format: `{device_measurement}_{pin_id}`
- Example: `BASE00479D607F9B4F8F9204EC0F1F04B177_0wFzB7hm`

**Business Fields:**
- Always: `value`

### Getting Measurement and Field Names

Retrieve from AutoPaddle APIs:
- Device details endpoint returns `measurement` field
- Device pin details endpoint returns `field` field

## Query Examples

### Query Device Pin Data

```javascript
const query = `
  from(bucket: "autopaddle-bucket")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "BASE00479D607F9B4F8F9204EC0F1F04B177")
    |> filter(fn: (r) => r._field == "BASE00479D607F9B4F8F9204EC0F1F04B177_0wFzB7hm")
`;

const data = [];
await queryApi.queryRows(query, {
  next(row, tableMeta) {
    const o = tableMeta.toObject(row);
    data.push(o);
  },
  error(error) {
    console.error('Query error:', error);
  },
  complete() {
    console.log('Query complete');
  }
});
```

### Query Business Data

```javascript
const query = `
  from(bucket: "autopaddle-bucket")
    |> range(start: -24h)
    |> filter(fn: (r) => r._measurement == "BUSINESS00479D607F9B4F8F9204EC0F1F04B177")
    |> filter(fn: (r) => r._field == "value")
    |> last()
`;
```

## Best Practices

1. **Use AutoPaddle APIs for metadata** - Get measurement and field names from device/business APIs
2. **Prefer cloud APIs for complex queries** - Use session-based query pattern for aggregations
3. **Direct InfluxDB for simple queries** - Use for real-time monitoring or simple time-range queries
4. **Handle connection errors** - InfluxDB may be unavailable if gateway is offline
