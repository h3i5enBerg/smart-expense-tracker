import React, { useState, useEffect, useMemo } from 'react'
import { Sidebar, TabType } from './components/layout/Sidebar'
import { StatCards } from './components/dashboard/StatCards'
import { TransactionFormModal } from './components/transactions/TransactionFormModal'
import { TransactionTable } from './components/transactions/TransactionTable'
import { BudgetManager } from './components/budgets/BudgetManager'
import {
  Category,
  TransactionWithCategory,
  BudgetWithSpend,
  CreateTransactionInput,
  SetBudgetInput
} from './types'
import {
  Plus,
  Calendar,
  RefreshCw,
  PieChart as PieIcon
} from 'lucide-react'

export function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [budgets, setBudgets] = useState<BudgetWithSpend[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)

  // Load data from IPC bridge
  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (window.api) {
        const [cats, txs, bdgs] = await Promise.all([
          window.api.getCategories(),
          window.api.getTransactions(),
          window.api.getBudgetsByMonth(selectedMonth)
        ])
        setCategories(cats || [])
        setTransactions(txs || [])
        setBudgets(bdgs || [])
      }
    } catch (err) {
      console.error('Failed to load financial data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  // Optimistic transaction addition
  const handleAddTransaction = async (input: CreateTransactionInput): Promise<void> => {
    if (!window.api) return
    const res = await window.api.addTransaction(input)
    const category = categories.find((c) => c.id === input.category_id)

    const newTx: TransactionWithCategory = {
      id: res.id,
      amount: input.amount,
      type: input.type,
      category_id: input.category_id,
      date: input.date,
      note: input.note ?? null,
      created_at: new Date().toISOString(),
      category_name: category?.name ?? null,
      category_color: category?.color ?? null,
      category_icon: category?.icon ?? null
    }

    setTransactions((prev) => [newTx, ...prev])

    // Update budget spend if applicable
    if (input.type === 'expense' && input.date.startsWith(selectedMonth)) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category_id === input.category_id
            ? { ...b, current_spend: b.current_spend + input.amount }
            : b
        )
      )
    }
  }

  // Optimistic transaction deletion
  const handleDeleteTransaction = async (id: number): Promise<void> => {
    if (!window.api) return
    const target = transactions.find((t) => t.id === id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))

    if (target && target.type === 'expense' && target.date.startsWith(selectedMonth)) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category_id === target.category_id
            ? { ...b, current_spend: Math.max(0, b.current_spend - target.amount) }
            : b
        )
      )
    }

    try {
      await window.api.deleteTransaction(id)
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      loadData()
    }
  }

  // Optimistic budget set / update
  const handleSetBudget = async (input: SetBudgetInput): Promise<void> => {
    if (!window.api) return
    await window.api.setBudget(input)

    setBudgets((prev) => {
      const existing = prev.find(
        (b) => b.category_id === input.category_id && b.month_year === input.month_year
      )
      const category = categories.find((c) => c.id === input.category_id)

      if (existing) {
        return prev.map((b) =>
          b.category_id === input.category_id && b.month_year === input.month_year
            ? { ...b, monthly_limit: input.monthly_limit }
            : b
        )
      } else {
        const currentMonthSpend = transactions
          .filter(
            (t) =>
              t.category_id === input.category_id &&
              t.type === 'expense' &&
              t.date.startsWith(input.month_year)
          )
          .reduce((sum, t) => sum + t.amount, 0)

        const newBudget: BudgetWithSpend = {
          id: Date.now(),
          category_id: input.category_id,
          category_name: category?.name || '',
          category_color: category?.color || '#3b82f6',
          category_icon: category?.icon || 'tag',
          monthly_limit: input.monthly_limit,
          month_year: input.month_year,
          current_spend: currentMonthSpend
        }
        return [...prev, newBudget]
      }
    })
  }

  // Report calculations
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth))
  }, [transactions, selectedMonth])

  const categoryExpenses = useMemo(() => {
    const expenseTx = monthlyTransactions.filter((t) => t.type === 'expense')
    const totalExp = expenseTx.reduce((sum, t) => sum + t.amount, 0)
    const map = new Map<number, { name: string; color: string; total: number }>()

    for (const tx of expenseTx) {
      const catId = tx.category_id ?? 0
      const existing = map.get(catId) || {
        name: tx.category_name || 'Uncategorized',
        color: tx.category_color || '#94a3b8',
        total: 0
      }
      existing.total += tx.amount
      map.set(catId, existing)
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: totalExp > 0 ? Math.round((item.total / totalExp) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [monthlyTransactions])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeTab}</h2>
            <p className="text-xs text-slate-400">
              Overview for{' '}
              <span className="font-semibold text-slate-200">{selectedMonth}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Month Filter */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Add Transaction Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-8 space-y-6 flex-1">
          {/* Summary KPI Cards */}
          <StatCards
            transactions={transactions}
            budgets={budgets}
            selectedMonth={selectedMonth}
          />

          {/* DASHBOARD TAB */}
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions List */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                    <p className="text-xs text-slate-400">Latest 5 activities</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('Transactions')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View All →
                  </button>
                </div>
                <TransactionTable
                  transactions={transactions.slice(0, 5)}
                  categories={categories}
                  onDeleteTransaction={handleDeleteTransaction}
                  compact
                />
              </div>

              {/* Quick Budget Progress */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Monthly Budgets</h3>
                      <p className="text-xs text-slate-400">Limits & spend tracker</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('Budgets')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      Manage →
                    </button>
                  </div>
                  <BudgetManager
                    budgets={budgets}
                    categories={categories}
                    selectedMonth={selectedMonth}
                    onSetBudget={handleSetBudget}
                    compact
                  />
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'Transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">All Transactions</h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive ledger of all your expense and income records
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Entry</span>
                </button>
              </div>
              <TransactionTable
                transactions={transactions}
                categories={categories}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}

          {/* BUDGETS TAB */}
          {activeTab === 'Budgets' && (
            <BudgetManager
              budgets={budgets}
              categories={categories}
              selectedMonth={selectedMonth}
              onSetBudget={handleSetBudget}
            />
          )}

          {/* REPORTS TAB */}
          {activeTab === 'Reports' && (
            <div className="space-y-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <PieIcon className="w-4 h-4" />
                  <span>Spending Distribution</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Monthly Expense Breakdown ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Categorical distribution of all outgoing expenses for this period.
                </p>

                <div className="mt-6 space-y-4">
                  {categoryExpenses.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs">
                      No expense data recorded for {selectedMonth}.
                    </div>
                  ) : (
                    categoryExpenses.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </span>
                          <span className="font-bold text-slate-300">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR'
                            }).format(item.total)}{' '}
                            <span className="text-slate-500 font-normal">
                              ({item.percentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: item.color,
                              width: `${item.percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Entry Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSubmit={handleAddTransaction}
      />
    </div>
  )
}

export default App
