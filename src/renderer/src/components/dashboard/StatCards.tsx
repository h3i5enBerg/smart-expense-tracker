import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle
} from 'lucide-react'
import { TransactionWithCategory, BudgetWithSpend } from '../../types'

interface StatCardsProps {
  transactions: TransactionWithCategory[]
  budgets: BudgetWithSpend[]
  selectedMonth: string // YYYY-MM
}

export const StatCards: React.FC<StatCardsProps> = ({
  transactions,
  budgets,
  selectedMonth
}) => {
  // Filter transactions for the selected month
  const monthlyTransactions = transactions.filter((tx) =>
    tx.date.startsWith(selectedMonth)
  )

  const totalIncome = monthlyTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpenses = monthlyTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const netSavings = totalIncome - totalExpenses

  // Total budget limit and spend across budgeted categories for this month
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0)
  const totalBudgetSpend = budgets.reduce((sum, b) => sum + b.current_spend, 0)
  const budgetLeft = totalBudgetLimit - totalBudgetSpend

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val)
  }

  const cards = [
    {
      title: 'Total Income',
      amount: formatCurrency(totalIncome),
      subtext: `${monthlyTransactions.filter((t) => t.type === 'income').length} incoming transactions`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      trend: '+ Active Month'
    },
    {
      title: 'Total Expenses',
      amount: formatCurrency(totalExpenses),
      subtext: `${monthlyTransactions.filter((t) => t.type === 'expense').length} outgoing transactions`,
      icon: TrendingDown,
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      trend: totalIncome > 0 ? `${Math.round((totalExpenses / totalIncome) * 100)}% of income` : '0%'
    },
    {
      title: 'Net Savings',
      amount: formatCurrency(netSavings),
      subtext: netSavings >= 0 ? 'Positive cash flow' : 'Negative cash flow deficit',
      icon: Wallet,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      badgeColor: netSavings >= 0 ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      trend: totalIncome > 0 ? `${Math.round((netSavings / totalIncome) * 100)}% saved` : '0%'
    },
    {
      title: 'Budget Remaining',
      amount: totalBudgetLimit > 0 ? formatCurrency(budgetLeft) : '₹0.00',
      subtext: totalBudgetLimit > 0 ? `Limit: ${formatCurrency(totalBudgetLimit)}` : 'No category budgets set',
      icon: AlertCircle,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      badgeColor: budgetLeft >= 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      trend: totalBudgetLimit > 0 ? (budgetLeft < 0 ? 'Over limit!' : `${Math.round((budgetLeft / totalBudgetLimit) * 100)}% left`) : 'N/A'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="group relative bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-slate-950/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {card.amount}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium truncate max-w-[130px]">
                  {card.subtext}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${card.badgeColor}`}
                >
                  {card.trend}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default StatCards
