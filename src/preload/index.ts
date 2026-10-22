import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface CreateTransactionInput {
  amount: number
  type: 'income' | 'expense'
  category_id: number | null
  date: string
  note?: string | null
}

export interface SetBudgetInput {
  category_id: number
  monthly_limit: number
  month_year: string
}

// Custom APIs for renderer
const api = {
  getTransactions: () => ipcRenderer.invoke('transactions:getAll'),
  addTransaction: (data: CreateTransactionInput) => ipcRenderer.invoke('transactions:add', data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('transactions:delete', id),
  getCategories: () => ipcRenderer.invoke('categories:getAll'),
  getBudgetsByMonth: (monthYear: string) => ipcRenderer.invoke('budgets:getByMonth', monthYear),
  setBudget: (data: SetBudgetInput) => ipcRenderer.invoke('budgets:set', data)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
