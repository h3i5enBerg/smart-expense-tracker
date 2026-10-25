import { ElectronAPI } from '@electron-toolkit/preload'

export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export interface TransactionWithCategory {
  id: number
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  date: string
  note: string | null
  created_at: string
  category_name: string | null
  category_color: string | null
  category_icon: string | null
}

export interface CreateTransactionInput {
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  date: string
  note?: string | null
}

export interface BudgetWithSpend {
  id: number
  category_id: number
  category_name: string
  category_color: string
  category_icon: string
  monthly_limit: number
  month_year: string
  current_spend: number
}

export interface SetBudgetInput {
  category_id: number
  monthly_limit: number
  month_year: string
}

export interface SaveFileResult {
  success: boolean
  canceled: boolean
  filePath?: string
  error?: string
}

export interface ExpenseTrackerAPI {
  getTransactions: () => Promise<TransactionWithCategory[]>
  addTransaction: (data: CreateTransactionInput) => Promise<{ id: number; success: boolean }>
  deleteTransaction: (id: number) => Promise<{ success: boolean; changes: number }>
  getCategories: () => Promise<Category[]>
  getBudgetsByMonth: (monthYear: string) => Promise<BudgetWithSpend[]>
  setBudget: (data: SetBudgetInput) => Promise<{ id: number; success: boolean }>
  saveExportFile: (
    fileName: string,
    content: string,
    type: 'csv' | 'pdf'
  ) => Promise<SaveFileResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ExpenseTrackerAPI
  }
}
