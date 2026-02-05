/**
 * 数据库初始化模块
 * 负责创建数据库文件和表结构
 */

import Database from 'better-sqlite3';
import { ALL_CREATE_STATEMENTS } from './schema';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 初始化数据库
 * @param dbPath 数据库文件路径
 * @returns Database 实例
 */
export function initDatabase(dbPath: string): Database.Database {
  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 创建数据库目录: ${dbDir}`);
  }

  // 检查数据库文件是否已存在
  const isNewDatabase = !fs.existsSync(dbPath);

  // 创建或打开数据库连接
  const db = new Database(dbPath);

  if (isNewDatabase) {
    console.log(`🗄️  创建新数据库: ${dbPath}`);
  } else {
    console.log(`🗄️  连接到现有数据库: ${dbPath}`);
  }

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 执行所有建表语句
  try {
    db.transaction(() => {
      for (const statement of ALL_CREATE_STATEMENTS) {
        db.exec(statement);
      }
    })();

    if (isNewDatabase) {
      console.log('✅ 数据库表结构创建成功');
    } else {
      console.log('✅ 数据库表结构验证成功');
    }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }

  return db;
}

/**
 * 获取默认数据库路径
 */
export function getDefaultDbPath(): string {
  // 数据库文件存放在项目根目录的 data 文件夹中
  const projectRoot = process.cwd();
  return path.join(projectRoot, 'data', 'app.db');
}
