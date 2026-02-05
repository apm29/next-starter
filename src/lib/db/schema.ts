/**
 * 数据库 Schema 定义和 TypeScript 接口
 */

// ==================== 表名常量 ====================
export const TABLE_NAMES = {
  USER_SETTINGS: 'user_settings',
} as const;

// ==================== TypeScript 接口定义 ====================

/**
 * 用户配置
 * 用途: 展示键值对存储
 */
export interface UserSetting {
  key: string;
  value: string; // JSON string
  updated_at: number;
}

// ==================== 建表 SQL 语句 ====================

/**
 * 创建 user_settings 表
 */
export const CREATE_USER_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.USER_SETTINGS} (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`;

/**
 * 所有建表语句（按顺序执行）
 */
export const ALL_CREATE_STATEMENTS = [
  CREATE_USER_SETTINGS_TABLE,
];
