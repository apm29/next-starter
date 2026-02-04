import { InfluxDB } from '@influxdata/influxdb-client';

/**
 * InfluxDB 客户端配置
 */
export function getInfluxDBClient() {
  const influxDB = new InfluxDB({
    url: `http://${process.env.GATEWAY_IP || 'localhost'}:18086`,
    token: 'autopaddle-api-token'
  });

  return influxDB;
}

/**
 * 查询设备引脚最新值
 * @param measurement - 设备的 measurement 名称
 * @param timeRange - 时间范围（默认 -1h）
 */
export async function queryDevicePinLatestValues(
  measurement: string,
  timeRange: string = '-1h'
): Promise<Record<string, any>> {
  const influxDB = getInfluxDBClient();
  const queryApi = influxDB.getQueryApi('autopaddle-org');

  // 查询该 measurement 下所有字段的最新值
  const query = `
    from(bucket: "autopaddle-bucket")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> last()
  `;

  const data: any[] = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row: string[], tableMeta: any) {
        const o = tableMeta.toObject(row);
        data.push(o);
      },
      error(error: Error) {
        console.error('InfluxDB query error:', error);
        reject(error);
      },
      complete() {
        // 转换为 { field: value } 格式
        const result: Record<string, any> = {};
        data.forEach((item) => {
          if (item._field && item._value !== undefined) {
            result[item._field] = {
              value: item._value,
              time: item._time,
            };
          }
        });
        resolve(result);
      }
    });
  });
}

/**
 * 查询设备引脚历史数据
 * @param measurement - 设备的 measurement 名称
 * @param field - 引脚字段名
 * @param timeRange - 时间范围
 */
export async function queryDevicePinHistory(
  measurement: string,
  field: string,
  timeRange: string = '-24h'
): Promise<any[]> {
  const influxDB = getInfluxDBClient();
  const queryApi = influxDB.getQueryApi('autopaddle');

  const query = `
    from(bucket: "autopaddle-bucket")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
  `;

  const data: any[] = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row: string[], tableMeta: any) {
        const o = tableMeta.toObject(row);
        data.push({
          time: o._time,
          value: o._value,
          field: o._field,
        });
      },
      error(error: Error) {
        console.error('InfluxDB query error:', error);
        reject(error);
      },
      complete() {
        resolve(data);
      }
    });
  });
}
