import React, { useState, useMemo } from 'react'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  // 2. Export PDF Handler via jsPDF & jspdf-autotable
  const handleExportPdf = async (): Promise<void> => {
    if (!window.api) return
    if (exportTransactions.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'No transactions found for the selected period to export.'
      })
      return
    }

    setIsExportingPdf(true)
    setStatusMessage(null)
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()

      // Header Banner
      doc.setFillColor(30, 41, 59) // slate-800
      doc.rect(0, 0, pageWidth, 75, 'F')

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(255, 255, 255)
      doc.text('SMART EXPENSE TRACKER', 40, 38)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184) // slate-400
      doc.text('EXECUTIVE FINANCIAL STATEMENT & TRANSACTION LEDGER', 40, 55)

      // Report Metadata
      const periodLabel = isAllTime ? 'All Time History' : `Period: ${selectedMonth}`
      const generatedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      doc.setFontSize(8.5)
      doc.setTextColor(203, 213, 225)
      doc.text(`Generated: ${generatedDate}`, pageWidth - 40, 38, { align: 'right' })
      doc.text(periodLabel, pageWidth - 40, 55, { align: 'right' })

      // KPI Metric Summary Boxes
      const cardY = 95
      const cardHeight = 55
      const gap = 12
      const cardWidth = (pageWidth - 80 - gap * 2) / 3

      // Total Income Card
      doc.setFillColor(240, 253, 244) // emerald-50
      doc.setDrawColor(187, 247, 208) // emerald-200
      doc.roundedRect(40, cardY, cardWidth, cardHeight, 6, 6, 'FD')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(21, 128, 61) // emerald-700
      doc.text('TOTAL INCOME', 50, cardY + 18)
      doc.setFontSize(13)
      doc.text(formatCurrency(totalIncome), 50, cardY + 40)

      // Total Expense Card
      const card2X = 40 + cardWidth + gap
      doc.setFillColor(255, 241, 242) // rose-50
      doc.setDrawColor(254, 205, 211) // rose-200
      doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 6, 6, 'FD')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(190, 18, 60) // rose-700
      doc.text('TOTAL EXPENSES', card2X + 10, cardY + 18)
      doc.setFontSize(13)
      doc.text(formatCurrency(totalExpense), card2X + 10, cardY + 40)

      // Net Savings Card
      const netSavings = totalIncome - totalExpense
      const card3X = card2X + cardWidth + gap
      doc.setFillColor(239, 246, 255) // blue-50
      doc.setDrawColor(191, 219, 254) // blue-200
      doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 6, 6, 'FD')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(29, 78, 216) // blue-700
      doc.text('NET SAVINGS / BALANCE', card3X + 10, cardY + 18)
      doc.setFontSize(13)
      doc.text(formatCurrency(netSavings), card3X + 10, cardY + 40)

      // Table of Transactions
      const tableRows = exportTransactions.map((tx) => [
        tx.date,
        tx.type.toUpperCase(),
        tx.category_name || 'Uncategorized',
        tx.note || '-',
        `${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}`
      ])

      autoTable(doc, {
        startY: 165,
        margin: { left: 40, right: 40, bottom: 40 },
        head: [['Date', 'Type', 'Category', 'Description / Note', 'Amount']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          cellPadding: 6
        },
        styles: {
          fontSize: 8,
          cellPadding: 5.5,
          textColor: [30, 41, 59],
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 60, fontStyle: 'bold' },
          2: { cellWidth: 100 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 95, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (hookData) => {
          if (hookData.section === 'body') {
            if (hookData.column.index === 1) {
              const val = String(hookData.cell.raw)
              hookData.cell.styles.textColor =
                val === 'INCOME' ? [21, 128, 61] : [225, 29, 72]
            } else if (hookData.column.index === 4) {
              const val = String(hookData.cell.raw)
              hookData.cell.styles.textColor = val.startsWith('-')
                ? [225, 29, 72]
                : [21, 128, 61]
            }
          }
        },
        didDrawPage: (hookData) => {
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(148, 163, 184)
          doc.text(
            `Smart Expense & Budget Tracker  •  Page ${hookData.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 20,
            { align: 'center' }
          )
        }
      })

      // Convert output to base64
      const uriString = doc.output('datauristring')
      const base64Content = uriString.split(',')[1]
      const fileName = isAllTime
        ? `Expense_Summary_All_Time_${new Date().toISOString().split('T')[0]}.pdf`
        : `Expense_Summary_${selectedMonth}.pdf`

      const res = await window.api.saveExportFile(fileName, base64Content, 'pdf')

      if (res.success && res.filePath) {
        setStatusMessage({
          type: 'success',
          text: `PDF document successfully generated and saved to: ${res.filePath}`
        })
      } else if (res.canceled) {
        setStatusMessage({
          type: 'info',
          text: 'PDF export cancelled by user.'
        })
      } else if (res.error) {
        setStatusMessage({
          type: 'error',
          text: `PDF generation failed: ${res.error}`
        })
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to export PDF statement.'
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
              Exports raw columns (Date, Type, Category, Description, and Amount) with UTF-8 BOM encoding.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || exportTransactions.length === 0}
            className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
            className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
