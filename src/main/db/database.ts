import Database, { Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let dbInstance: DatabaseType | null = null

export function getDatabasePath(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const userData = app.getPath('userData')
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true })
      }
      return path.join(userData, 'budget_tracker.db')
    }
  } catch {
    // Fallback when running outside electron app context (e.g. direct test scripts)
  }
  return path.join(process.cwd(), 'budget_tracker.db')
}

export function initDatabase(customPath?: string): DatabaseType {
  if (dbInstance && !customPath) {
    return dbInstance
  }

  const dbPath = customPath || getDatabasePath()
  const db = new Database(dbPath)

  // Enable WAL mode for data integrity and foreign keys for relational consistency
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT 'tag'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      monthly_limit REAL NOT NULL,
      month_year TEXT NOT NULL,
      UNIQUE(category_id, month_year)
    );
  `)

  // Seed default categories if table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (countRow.count === 0) {
    const insert = db.prepare(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)'
    )
    const seedCategories = [
      // Expenses
      { name: 'Food & Dining', type: 'expense', color: '#f97316', icon: 'utensils' },
      { name: 'Transportation', type: 'expense', color: '#06b6d4', icon: 'car' },
      { name: 'Utilities & Bills', type: 'expense', color: '#eab308', icon: 'zap' },
      { name: 'Entertainment', type: 'expense', color: '#a855f7', icon: 'film' },
      { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'shopping-bag' },
      // Income
      { name: 'Salary', type: 'income', color: '#22c55e', icon: 'briefcase' },
      { name: 'Freelance', type: 'income', color: '#10b981', icon: 'laptop' },
      { name: 'Investments', type: 'income', color: '#3b82f6', icon: 'trending-up' }
    ]

    const seedTransaction = db.transaction((categories: typeof seedCategories) => {
      for (const cat of categories) {
        insert.run(cat.name, cat.type, cat.color, cat.icon)
      }
    })
    seedTransaction(seedCategories)
  }

  if (!customPath) {
    dbInstance = db
  }

  return db
}

export function getDatabase(): DatabaseType {
  if (!dbInstance) {
    return initDatabase()
  }
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
