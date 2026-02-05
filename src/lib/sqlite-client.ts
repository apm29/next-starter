/**
 * SQLite 客户端 - 单例模式
 * 提供统一的数据库访问接口
 */

import Database from 'better-sqlite3';
import { initDatabase, getDefaultDbPath } from './db/init';

/**
 * SQLite 客户端类
 * 使用单例模式确保只有一个数据库连接
 */
class SQLiteClient {
  private static instance: SQLiteClient | null = null;
  private db: Database.Database;

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor(dbPath?: string) {
    const path = dbPath || getDefaultDbPath();
    this.db = initDatabase(path);
  }

  /**
   * 获取 SQLiteClient 单例实例
   * @param dbPath 可选的数据库路径（仅首次调用时有效）
   * @returns SQLiteClient 实例
   */
  public static getInstance(dbPath?: string): SQLiteClient {
    if (!SQLiteClient.instance) {
      SQLiteClient.instance = new SQLiteClient(dbPath);
    }
    return SQLiteClient.instance;
  }

  /**
   * 执行查询（SELECT）
   * @param sql SQL 查询语句
   * @param params 查询参数
   * @returns 查询结果数组
   */
  public query<T = any>(sql: string, params?: any[]): T[] {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.all(...params) : stmt.all();
      return result as T[];
    } catch (error) {
      console.error('❌ 查询执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行查询并返回单条记录
   * @param sql SQL 查询语句
   * @param params 查询参数
   * @returns 单条记录或 undefined
   */
  public queryOne<T = any>(sql: string, params?: any[]): T | undefined {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.get(...params) : stmt.get();
      return result as T | undefined;
    } catch (error) {
      console.error('❌ 查询执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行命令（INSERT, UPDATE, DELETE）
   * @param sql SQL 命令语句
   * @param params 命令参数
   * @returns 执行结果（包含 changes 和 lastInsertRowid）
   */
  public run(sql: string, params?: any[]): Database.RunResult {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return result;
    } catch (error) {
      console.error('❌ 命令执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行事务
   * @param fn 事务函数
   * @returns 事务函数的返回值
   */
  public transaction<T>(fn: () => T): T {
    const txn = this.db.transaction(fn);
    return txn();
  }

  /**
   * 获取原始数据库实例（高级用法）
   * @returns Database 实例
   */
  public getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * 关闭数据库连接
   * 注意：关闭后需要重新获取实例才能继续使用
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      SQLiteClient.instance = null;
      console.log('🔒 数据库连接已关闭');
    }
  }
}

export default SQLiteClient;
