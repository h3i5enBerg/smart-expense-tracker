export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export interface Transaction {
  id: number
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  date: string
  note: string | null
  created_at: string
}

export interface TransactionWithCategory extends Transaction {
  category_name: string | null
  category_color: string | null
  category_icon: string | null
}

export interface Budget {
  id: number
  category_id: number
  monthly_limit: number
  month_year: string
}

export interface BudgetWithSpend extends Budget {
  category_name: string
  category_color: string
  category_icon: string
  current_spend: number
}
