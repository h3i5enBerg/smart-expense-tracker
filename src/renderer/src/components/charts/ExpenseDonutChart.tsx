import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { PieChart as PieIcon } from 'lucide-react'
import { TransactionWithCategory } from '../../types'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ExpenseDonutChartProps {
  transactions: TransactionWithCategory[]
  selectedMonth: string
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  transactions,
  selectedMonth
}) => {
  // Aggregate expenses by category for current month
  const categoryData = useMemo(() => {
    const monthlyExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth)
    )

    const map = new Map<string, { total: number; color: string }>()

    for (const tx of monthlyExpenses) {
      const name = tx.category_name || 'Uncategorized'
      const color = tx.category_color || '#94a3b8'
      const current = map.get(name) || { total: 0, color }
      current.total += tx.amount
      map.set(name, current)
    }

    const labels = Array.from(map.keys())
    const data = labels.map((k) => map.get(k)!.total)
    const backgroundColors = labels.map((k) => map.get(k)!.color)
    const totalExpense = data.reduce((sum, v) => sum + v, 0)

    return {
      labels,
      data,
      backgroundColors,
      totalExpense
    }
  }, [transactions, selectedMonth])

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val)
  }

  if (categoryData.data.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px]">
        <div className="p-3 rounded-full bg-slate-800/80 text-slate-500 mb-3">
          <PieIcon className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No Expense Data</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[220px] text-center">
          No expenses recorded for {selectedMonth} to display category distribution.
        </p>
      </div>
    )
  }

  const chartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.backgroundColors,
        borderColor: '#0f172a', // slate-900
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1', // slate-300
          font: {
            size: 11,
            family: 'system-ui, sans-serif',
            weight: 500
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#020617', // slate-950
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: { label?: string; raw: unknown }): string => {
            const rawVal = Number(context.raw) || 0
            const percentage =
              categoryData.totalExpense > 0
                ? Math.round((rawVal / categoryData.totalExpense) * 100)
                : 0
            return ` ${context.label || ''}: ${formatCurrency(rawVal)} (${percentage}%)`
          }
        }
      }
    },
    cutout: '72%'
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Expense Distribution</h3>
          <p className="text-xs text-slate-400">By category breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-500 font-medium block">Total Spend</span>
          <span className="text-xs font-bold text-rose-400">
            {formatCurrency(categoryData.totalExpense)}
          </span>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
        {/* Center label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
          <span className="text-[11px] font-semibold text-slate-400">Expenses</span>
          <span className="text-sm font-bold text-white tracking-tight">
            {categoryData.labels.length} Cats
          </span>
        </div>
      </div>
    </div>
  )
}
export default ExpenseDonutChart
