import React, { useState, useMemo } from 'react'
import Papa from 'papaparse'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { TransactionWithCategory } from '../../types'

interface ExportPanelProps {
  transactions: TransactionWithCategory[]
  selectedMonth: string
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  transactions,
  selectedMonth
}) => {
  const [isAllTime, setIsAllTime] = useState<boolean>(false)
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false)
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  // Filter transactions based on selection
  const exportTransactions = useMemo(() => {
    if (isAllTime) {
      return [...transactions].sort((a, b) => b.date.localeCompare(a.date))
    }
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, selectedMonth, isAllTime])

  const totalIncome = exportTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = exportTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val)
  }

  // 1. Export CSV Handler
  const handleExportCsv = async (): Promise<void> => {
    if (!window.api) return
    if (exportTransactions.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'No transactions found for the selected period to export.'
      })
      return
    }

    setIsExportingCsv(true)
    setStatusMessage(null)
    try {
      const dataRows = exportTransactions.map((tx) => ({
        Date: tx.date,
        Type: tx.type.toUpperCase(),
        Category: tx.category_name || 'Uncategorized',
        Description: tx.note || '',
        'Amount (INR)': tx.amount.toFixed(2)
      }))

      const csvContent = Papa.unparse(dataRows)
      const fileName = isAllTime
        ? `Expense_Report_All_Time_${new Date().toISOString().split('T')[0]}.csv`
        : `Expense_Report_${selectedMonth}.csv`

      const res = await window.api.saveExportFile(fileName, csvContent, 'csv')

      if (res.success && res.filePath) {
        setStatusMessage({
          type: 'success',
          text: `CSV file successfully saved to: ${res.filePath}`
        })
      } else if (res.canceled) {
        setStatusMessage({
          type: 'info',
          text: 'CSV export cancelled by user.'
        })
      } else if (res.error) {
        setStatusMessage({
          type: 'error',
          text: `Export failed: ${res.error}`
        })
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to generate CSV export.'
      })
    } finally {
      setIsExportingCsv(false)
    }
  }

  // Placeholder for PDF handler (will be fully implemented in Commit 10)
  const handleExportPdf = async (): Promise<void> => {
    setIsExportingPdf(true)
    try {
      setStatusMessage({
        type: 'info',
        text: 'Preparing PDF engine...'
      })
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            <span>Data Export & Archiving</span>
          </div>
          <h3 className="text-lg font-bold text-white">Generate Reports & Statements</h3>
          <p className="text-xs text-slate-400 mt-1">
            Export structured financial records to standard CSV spreadsheets or executive PDF summaries.
          </p>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllTime}
              onChange={(e) => setIsAllTime(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Export All Time Records ({transactions.length})</span>
          </label>

          {!isAllTime && (
            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-800 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-200">{selectedMonth}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Selected Records</span>
          <span className="text-base font-extrabold text-white">
            {exportTransactions.length} transactions
          </span>
        </div>
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Income in Period</span>
          <span className="text-base font-extrabold text-emerald-400">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Expense in Period</span>
          <span className="text-base font-extrabold text-rose-400">
            {formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-start space-x-2.5 p-3.5 rounded-xl border text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="break-all">{statusMessage.text}</span>
        </div>
      )}

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* CSV Export Card */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">CSV Spreadsheet</h4>
                <p className="text-[11px] text-slate-400">
                  Universal format for Microsoft Excel, Numbers, and Google Sheets
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exports raw columns (Date, Type, Category, Description, and Amount) with UTF-8 encoding.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || exportTransactions.length === 0}
            className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingCsv ? 'Saving File...' : 'Export as CSV'}</span>
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PDF Statement</h4>
                <p className="text-[11px] text-slate-400">
                  Formatted summary sheet for printing and archiving
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates an executive financial summary document complete with KPI totals and formatted tables.
            </p>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || exportTransactions.length === 0}
            className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Generating PDF...' : 'Export as PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default ExportPanel
