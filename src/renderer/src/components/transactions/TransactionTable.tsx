import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react'
import { Category, TransactionWithCategory } from '../../types'

interface TransactionTableProps {
  transactions: TransactionWithCategory[]
  categories: Category[]
  onDeleteTransaction: (id: number) => Promise<void>
  compact?: boolean
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categories,
  onDeleteTransaction,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search note or category
      const matchesSearch =
        searchTerm === '' ||
        (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.category_name && tx.category_name.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || String(tx.category_id) === selectedCategory

      // Type filter
      const matchesType = selectedType === 'all' || tx.type === selectedType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [transactions, searchTerm, selectedCategory, selectedType])

  const handleDelete = async (id: number): Promise<void> => {
    setDeletingId(id)
    try {
      await onDeleteTransaction(id)
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
    } catch {
      // fallback
    }
    return dateStr
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Controls / Filters (omitted if compact) */}
      {!compact && (
        <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by note or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Type Filter */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedType === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('expense')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedType === 'expense'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setSelectedType('income')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-7 pr-8 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/60 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Receipt className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No transactions recorded</p>
                    <p className="text-xs text-slate-500">
                      Use the &quot;Add Transaction&quot; button to record your first expense or income.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'expense'
                return (
                  <tr
                    key={tx.id}
                    className="group hover:bg-slate-800/30 transition-colors duration-150"
                  >
                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-300 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDate(tx.date)}</span>
                      </div>
                    </td>

                    {/* Note */}
                    <td className="px-5 py-3.5 text-white font-medium max-w-[220px] truncate">
                      {tx.note || <span className="text-slate-500 italic">No description</span>}
                    </td>

                    {/* Category Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                        style={{
                          backgroundColor: `${tx.category_color || '#64748b'}15`,
                          borderColor: `${tx.category_color || '#64748b'}35`,
                          color: tx.category_color || '#94a3b8'
                        }}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tx.category_name || 'Uncategorized'}</span>
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-sm">
                      <span
                        className={`inline-flex items-center space-x-1 ${
                          isExpense ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isExpense ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        title="Delete Transaction"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default TransactionTable
