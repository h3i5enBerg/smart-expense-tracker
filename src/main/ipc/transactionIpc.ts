import { ipcMain } from 'electron'
import { getDatabase } from '../db/database'
import { Category, TransactionWithCategory, BudgetWithSpend } from '../db/types'

export interface CreateTransactionInput {
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  date: string
  note?: string | null
}

export interface SetBudgetInput {
  category_id: number
  monthly_limit: number
  month_year: string
}

export function registerTransactionIpc(): void {
  const db = getDatabase()

  // 1. transactions:getAll -> Returns transactions joined with category name and color
  ipcMain.handle('transactions:getAll', async (): Promise<TransactionWithCategory[]> => {
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.type,
        t.category_id,
        t.date,
        t.note,
        t.created_at,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.id DESC
    `)
    return stmt.all() as TransactionWithCategory[]
  })

  // 2. transactions:add -> Prepared INSERT statement
  ipcMain.handle(
    'transactions:add',
    async (
      _,
      data: CreateTransactionInput
    ): Promise<{ id: number | bigint; success: boolean }> => {
      const stmt = db.prepare(`
        INSERT INTO transactions (amount, type, category_id, date, note)
        VALUES (@amount, @type, @category_id, @date, @note)
      `)
      const info = stmt.run({
        amount: data.amount,
        type: data.type,
        category_id: data.category_id ?? null,
        date: data.date,
        note: data.note ?? null
      })
      return { id: info.lastInsertRowid, success: true }
    }
  )

  // 3. transactions:delete -> Prepared DELETE by ID
  ipcMain.handle(
    'transactions:delete',
    async (_, id: number): Promise<{ success: boolean; changes: number }> => {
      const stmt = db.prepare('DELETE FROM transactions WHERE id = ?')
      const info = stmt.run(id)
      return { success: info.changes > 0, changes: info.changes }
    }
  )

  // 4. categories:getAll -> Returns all categories
  ipcMain.handle('categories:getAll', async (): Promise<Category[]> => {
    const stmt = db.prepare(`
      SELECT id, name, type, color, icon 
      FROM categories 
      ORDER BY type DESC, name ASC
    `)
    return stmt.all() as Category[]
  })

  // 5. budgets:getByMonth -> Returns category budgets joined with current month spend
  ipcMain.handle(
    'budgets:getByMonth',
    async (_, monthYear: string): Promise<BudgetWithSpend[]> => {
      const stmt = db.prepare(`
        SELECT 
          b.id,
          b.category_id,
          c.name AS category_name,
          c.color AS category_color,
          c.icon AS category_icon,
          b.monthly_limit,
          b.month_year,
          COALESCE(SUM(t.amount), 0) AS current_spend
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = b.category_id 
          AND t.type = 'expense' 
          AND substr(t.date, 1, 7) = b.month_year
        WHERE b.month_year = ?
        GROUP BY b.id, b.category_id, c.name, c.color, c.icon, b.monthly_limit, b.month_year
      `)
      return stmt.all(monthYear) as BudgetWithSpend[]
    }
  )

  // 6. budgets:set -> Upsert statement for monthly budget limits
  ipcMain.handle(
    'budgets:set',
    async (
      _,
      data: SetBudgetInput
    ): Promise<{ id: number | bigint; success: boolean }> => {
      const stmt = db.prepare(`
        INSERT INTO budgets (category_id, monthly_limit, month_year)
        VALUES (@category_id, @monthly_limit, @month_year)
        ON CONFLICT(category_id, month_year) DO UPDATE SET
          monthly_limit = excluded.monthly_limit
      `)
      const info = stmt.run({
        category_id: data.category_id,
        monthly_limit: data.monthly_limit,
        month_year: data.month_year
      })
      return { id: info.lastInsertRowid, success: true }
    }
  )
}
