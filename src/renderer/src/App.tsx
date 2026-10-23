import React, { useState, useEffect } from 'react'
import { Sidebar, TabType } from './components/layout/Sidebar'
import { StatCards } from './components/dashboard/StatCards'
import { TransactionFormModal } from './components/transactions/TransactionFormModal'
import { Category, TransactionWithCategory, BudgetWithSpend, CreateTransactionInput } from './types'
import { Plus, Calendar, RefreshCw } from 'lucide-react'

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

          {/* Tab Placeholder or Views */}
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                  <button
                    onClick={() => setActiveTab('Transactions')}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View All →
                  </button>
                </div>
                <div className="text-xs text-slate-500 py-8 text-center">
                  Transactions will be listed here.
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Monthly Budgets</h3>
                  <button
                    onClick={() => setActiveTab('Budgets')}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Manage →
                  </button>
                </div>
                <div className="text-xs text-slate-500 py-8 text-center">
                  Budget progress will be shown here.
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
