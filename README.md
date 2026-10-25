# Smart Expense & Budget Tracker

A high-performance, private, and fully offline desktop financial application built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, and **SQLite (`better-sqlite3`)**.

---

## Overview

**Smart Expense & Budget Tracker** provides an intuitive desktop interface for tracking personal income, logging daily expenses, monitoring category budgets with real-time threshold warnings, and viewing deep visual analytics — without sending any data over the internet.

All records are stored locally in an embedded SQLite database configured with **Write-Ahead Logging (WAL)** mode for robust data integrity and multi-process performance.

---

## Core Features

- **Private & Local-First SQLite Database**: 
  - Complete zero-latency offline persistence via `better-sqlite3`.
  - Automated database schema migrations and pre-seeded income/expense categories.
  - High concurrency and crash resilience enabled via SQLite WAL mode (`PRAGMA journal_mode = WAL;`).

- **Income & Expense Tracking**:
  - Quick transaction entry with type toggles, currency inputs (₹), category tags, and descriptive notes.
  - Interactive transaction ledger with live search, category filtering, and instant deletion.
  - Optimistic React state updates ensuring instantaneous UI responses.

- **Dynamic Monthly Budget Caps**:
  - Monthly category spending limits with automatic spend aggregation.
  - Color-coded threshold indicators:
    - **< 80%**: Emerald / Green (On Track)
    - **80% - 100%**: Amber / Orange (Threshold Warning)
    - **> 100%**: Rose / Red Alert ("Over Budget" badge)
  - Inline limit updating directly from the Budget control center.

- **Visual Financial Analytics**:
  - **Category Expense Donut Chart**: Real-time spending distribution breakdown with custom currency tooltips.
  - **6-Month Cash Flow Trend**: Side-by-side comparison of total income vs. total expenses across rolling historical periods using Chart.js.

- **Desktop Export Center**:
  - **CSV Spreadsheets**: Exports clean tabular data with UTF-8 BOM encoding for seamless opening in Microsoft Excel and Google Sheets via `papaparse`.
  - **Executive PDF Statements**: Generates professionally styled financial statements featuring branded header banners, KPI summaries, and zebra-striped ledgers using `jspdf` and `jspdf-autotable`.
  - Native desktop file save dialogs via Electron's `dialog.showSaveDialog`.

---

## Architecture

The application implements a secure, isolated desktop architecture conforming to Electron security best practices (Context Isolation, Sandboxed Preload, and explicit IPC endpoints):

```text
┌─────────────────────────────────────────────────────────────┐
│                    React UI (Renderer)                      │
│      Dashboard • Transactions • Budgets • Reports • Charts  │
└──────────────────────────────▲──────────────────────────────┘
                               │
                ContextBridge (`window.api`)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Preload Script Bridge                    │
│   Transactions • Categories • Budgets • Native Save Dialog  │
└──────────────────────────────▲──────────────────────────────┘
                               │
                      IPC Communication
                     (`ipcMain.handle`)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Electron Main Process                    │
│      Lifecycle Management • Native Windows • Dialogs        │
└──────────────────────────────▲──────────────────────────────┘
                               │
                         Synchronous
                        C++ Native ABI
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   SQLite (better-sqlite3)                   │
│   WAL Mode • budget_tracker.db (userData) • Relational FK   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

- **Framework**: Electron 44, electron-vite
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Database**: `better-sqlite3` (Compiled for Electron Node ABI)
- **Visual Analytics**: `chart.js`, `react-chartjs-2`
- **Export Engines**: `papaparse` (CSV), `jspdf`, `jspdf-autotable` (PDF)
- **Icons**: `lucide-react`

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **C/C++ Build Tools**: Required for compiling native modules (`python`, `make`, `gcc`/`clang` or Visual Studio tools).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/h3i5enBerg/smart-expense-tracker.git
   cd smart-expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Rebuild native modules for Electron (if needed):
   ```bash
   npx electron-rebuild -f -w better-sqlite3
   ```

---

## Development & Build Commands

| Command | Action |
|---|---|
| `npm run dev` | Launch the development environment with Hot Module Replacement (HMR). |
| `npm run typecheck` | Run TypeScript type checks across Node main and Web renderer configurations. |
| `npm run build` | Validate TypeScript types and bundle the production Electron app into `out/`. |
| `npm run build:mac` | Package distributable macOS installer/app. |
| `npm run build:win` | Package distributable Windows installer. |
| `npm run build:linux` | Package distributable Linux AppImage/deb. |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Author**: h3i5enBerg <nirajssatam@gmail.com>
