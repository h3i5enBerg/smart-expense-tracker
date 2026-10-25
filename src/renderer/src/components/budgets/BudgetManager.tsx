import React, { useState } from 'react'
import {
  PieChart,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Check,
  X,
  Tag
} from 'lucide-react'
import { Category, BudgetWithSpend, SetBudgetInput } from '../../types'

interface BudgetManagerProps {
  budgets: BudgetWithSpend[]
  categories: Category[]
  selectedMonth: string // YYYY-MM
  onSetBudget: (data: SetBudgetInput) => Promise<void>
  compact?: boolean
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  categories,
  selectedMonth,
  onSetBudget,
  compact = false
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editLimit, setEditLimit] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  // Map categories to existing budget or default
  const budgetList = expenseCategories.map((cat) => {
    const existing = budgets.find((b) => b.category_id === cat.id)
    return {
      category_id: cat.id,
      category_name: cat.name,
      category_color: cat.color,
      category_icon: cat.icon,
      monthly_limit: existing ? existing.monthly_limit : 0,
      current_spend: existing ? existing.current_spend : 0,
      hasBudget: !!existing && existing.monthly_limit > 0
    }
  })

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val)
  }

  const handleStartEdit = (catId: number, currentLimit: number): void => {
    setEditingCategoryId(catId)
    setEditLimit(currentLimit > 0 ? String(currentLimit) : '')
  }

  const handleSaveBudget = async (catId: number): Promise<void> => {
    const numLimit = parseFloat(editLimit)
    if (isNaN(numLimit) || numLimit < 0) {
      setEditingCategoryId(null)
      return
    }

    setIsSaving(true)
    try {
      await onSetBudget({
        category_id: catId,
        monthly_limit: numLimit,
        month_year: selectedMonth
      })
      setEditingCategoryId(null)
    } finally {
      setIsSaving(false)
    }
  }

  // If compact view for Dashboard
  if (compact) {
    const activeBudgets = budgetList.filter((b) => b.hasBudget).slice(0, 4)
    if (activeBudgets.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 text-xs">
          <p className="font-medium text-slate-400">No active budgets for {selectedMonth}</p>
          <p className="mt-1 text-[11px]">Set category limits in the Budgets tab.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {activeBudgets.map((b) => {
          const percent = b.monthly_limit > 0 ? (b.current_spend / b.monthly_limit) * 100 : 0
          const isOver = percent > 100
          const isWarning = percent >= 80 && percent <= 100

          let progressColor = 'bg-emerald-500'
          if (isOver) progressColor = 'bg-rose-500'
          else if (isWarning) progressColor = 'bg-amber-500'

          return (
            <div key={b.category_id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: b.category_color }}
                  />
                  {b.category_name}
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  {formatCurrency(b.current_spend)} /{' '}
                  <span className="text-slate-500">{formatCurrency(b.monthly_limit)}</span>
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Full Budget Manager View
  const totalLimit = budgetList.reduce((sum, b) => sum + b.monthly_limit, 0)
  const totalSpend = budgetList.reduce((sum, b) => sum + b.current_spend, 0)
  const totalPercent = totalLimit > 0 ? Math.round((totalSpend / totalLimit) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Month Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <PieChart className="w-4 h-4" />
              <span>Budget Control Center</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Month of {selectedMonth}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Track category limits and prevent overspending with real-time threshold warnings.
            </p>
          </div>

          <div className="flex items-center space-x-6 bg-slate-950/60 border border-slate-800/80 rounded-xl px-5 py-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Allocated Limit</span>
              <span className="text-base font-bold text-white">{formatCurrency(totalLimit)}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Total Spent</span>
              <span className={`text-base font-bold ${totalSpend > totalLimit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(totalSpend)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Overall Progress</span>
              <span className="text-base font-bold text-indigo-300">{totalPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Prompt if no limits configured */}
      {totalLimit === 0 && (
        <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 text-indigo-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-indigo-400" />
          <div className="text-xs">
            <span className="font-bold text-white block">
              No monthly spending caps configured for {selectedMonth}
            </span>
            <span className="text-slate-400">
              Set monthly budget limits on any category below to enable color-coded threshold warnings and prevent overspending.
            </span>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetList.map((cat) => {
          const percent = cat.monthly_limit > 0 ? (cat.current_spend / cat.monthly_limit) * 100 : 0
          const isOver = cat.hasBudget && percent > 100
          const isWarning = cat.hasBudget && percent >= 80 && percent <= 100
          const isSafe = cat.hasBudget && percent < 80
          const isEditing = editingCategoryId === cat.category_id

          let statusBadge: React.ReactNode = null
          let progressBarBg = 'bg-slate-700'

          if (cat.hasBudget) {
            if (isOver) {
              progressBarBg = 'bg-rose-500'
              statusBadge = (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Over Budget (+{formatCurrency(cat.current_spend - cat.monthly_limit)})</span>
                </span>
              )
            } else if (isWarning) {
              progressBarBg = 'bg-amber-500'
              statusBadge = (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Warning ({Math.round(percent)}%)</span>
                </span>
              )
            } else if (isSafe) {
              progressBarBg = 'bg-emerald-500'
              statusBadge = (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>On Track ({Math.round(percent)}%)</span>
                </span>
              )
            }
          }

          return (
            <div
              key={cat.category_id}
              className={`bg-slate-900/70 border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between ${
                isOver
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm"
                      style={{
                        backgroundColor: `${cat.category_color}20`,
                        color: cat.category_color,
                        border: `1px solid ${cat.category_color}40`
                      }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{cat.category_name}</h4>
                      <p className="text-[11px] text-slate-400">Monthly Target</p>
                    </div>
                  </div>

                  {statusBadge}
                </div>

                {/* Progress Bar & Figures */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-medium">Spent</span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white">
                        {formatCurrency(cat.current_spend)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        / {cat.hasBudget ? formatCurrency(cat.monthly_limit) : 'No limit'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${progressBarBg} transition-all duration-300 rounded-full`}
                      style={{ width: `${cat.hasBudget ? Math.min(100, percent) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Set / Edit Limit Control */}
              <div className="mt-5 pt-3 border-t border-slate-800/60">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Limit amount"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleSaveBudget(cat.category_id)}
                      disabled={isSaving}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                      title="Save Limit"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {cat.hasBudget
                        ? `Threshold alert at ${formatCurrency(cat.monthly_limit * 0.8)}`
                        : 'Uncapped spending'}
                    </span>
                    <button
                      onClick={() => handleStartEdit(cat.category_id, cat.monthly_limit)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      {cat.hasBudget ? (
                        <>
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Limit</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Set Limit</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default BudgetManager
