import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { TransactionWithCategory } from '../../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MonthlyTrendChartProps {
  transactions: TransactionWithCategory[]
  selectedMonth: string // YYYY-MM
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  transactions,
  selectedMonth
}) => {
  // Compute past 6 months ending at selectedMonth
  const trendData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-')
    const currentYear = parseInt(yearStr, 10) || new Date().getFullYear()
    const currentMonth = parseInt(monthStr, 10) || new Date().getMonth() + 1

    const months: { key: string; label: string }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${y}-${m}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      months.push({ key, label })
    }

    const incomeData: number[] = []
    const expenseData: number[] = []

    for (const m of months) {
      const monthTx = transactions.filter((tx) => tx.date.startsWith(m.key))
      const inc = monthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const exp = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      incomeData.push(inc)
      expenseData.push(exp)
    }

    return {
      labels: months.map((m) => m.label),
      incomeData,
      expenseData
    }
  }, [transactions, selectedMonth])

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Income',
        data: trendData.incomeData,
        backgroundColor: '#10b981', // emerald-500
        hoverBackgroundColor: '#059669',
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.75
      },
      {
        label: 'Expenses',
        data: trendData.expenseData,
        backgroundColor: '#f43f5e', // rose-500
        hoverBackgroundColor: '#e11d48',
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.75
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#cbd5e1',
          font: {
            size: 11,
            family: 'system-ui, sans-serif',
            weight: 500
          },
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#020617',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context: { dataset?: { label?: string }; raw: unknown }): string => {
            const val = Number(context.raw) || 0
            return ` ${context.dataset?.label || ''}: ${formatCurrency(val)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.4)' // slate-700/40
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          },
          callback: (value: string | number): string => formatCurrency(Number(value))
        }
      }
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">6-Month Cash Flow Trend</h3>
          <p className="text-xs text-slate-400">Income vs. Expense side-by-side</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
export default MonthlyTrendChart
