import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'

export interface SaveFileInput {
  fileName: string
  content: string // plain string for CSV, base64-encoded for PDF
  type: 'csv' | 'pdf'
}

export interface SaveFileResult {
  success: boolean
  canceled: boolean
  filePath?: string
  error?: string
}

export function registerExportIpc(): void {
  ipcMain.handle(
    'export:saveFile',
    async (event, data: SaveFileInput): Promise<SaveFileResult> => {
      try {
        const focusedWindow = BrowserWindow.fromWebContents(event.sender)
        const filters =
          data.type === 'csv'
            ? [{ name: 'CSV Spreadsheets (*.csv)', extensions: ['csv'] }]
            : [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]

        const dialogOptions = {
          title: `Save ${data.type.toUpperCase()} Report`,
          defaultPath: data.fileName,
          filters
        }

        const { canceled, filePath } = focusedWindow
          ? await dialog.showSaveDialog(focusedWindow, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions)

        if (canceled || !filePath) {
          return { success: false, canceled: true }
        }

        if (data.type === 'pdf') {
          const buffer = Buffer.from(data.content, 'base64')
          fs.writeFileSync(filePath, buffer)
        } else {
          // Write with UTF-8 BOM so Excel opens Indian Rupee (₹) and UTF-8 characters cleanly
          const bom = '\ufeff'
          fs.writeFileSync(filePath, bom + data.content, 'utf-8')
        }

        return { success: true, canceled: false, filePath }
      } catch (err: unknown) {
        return {
          success: false,
          canceled: false,
          error: err instanceof Error ? err.message : 'Unknown error saving file'
        }
      }
    }
  )
}
