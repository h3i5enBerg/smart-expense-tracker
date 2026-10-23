import React from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  BarChart3,
  Wallet,
  Sparkles
} from 'lucide-react'

export type TabType = 'Dashboard' | 'Transactions' | 'Budgets' | 'Reports'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const navItems: { label: TabType; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Transactions', icon: ReceiptText },
  { label: 'Budgets', icon: PieChart },
  { label: 'Reports', icon: BarChart3 }
]

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
              SmartExpense
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Budget & Finance</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.label
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-white' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info / Local DB Badge */}
      <div className="p-4 m-3 rounded-2xl bg-slate-800/40 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local SQLite Storage</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          100% private & offline. Secured via SQLite WAL mode.
        </p>
      </div>
    </aside>
  )
}
export default Sidebar
