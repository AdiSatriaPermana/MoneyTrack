import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  FileText,
  Download,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowDownToLine,
} from 'lucide-react'

import AppShell from '../components/AppShell'
import { useTransactions } from '../hooks/useTransactions'
import { formatIDR } from '../utils/format'

const REPORT_PERIODS = [
  { key: 'this-month', label: 'Bulan ini' },
  { key: 'last-month', label: 'Bulan lalu' },
  { key: 'this-year', label: 'Tahun ini' },
  { key: 'custom', label: 'Custom' },
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
}

function formatDateDisplay(dateString) {
  if (!dateString) return '-'

  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) return dateString

  return `${day}/${month}/${year}`
}

function getPeriodDates(period) {
  const now = new Date()

  if (period === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      start: formatDateLocal(start),
      end: formatDateLocal(end),
    }
  }

  if (period === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)

    return {
      start: formatDateLocal(start),
      end: formatDateLocal(end),
    }
  }

  if (period === 'this-year') {
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)

    return {
      start: formatDateLocal(start),
      end: formatDateLocal(end),
    }
  }

  return {
    start: '',
    end: '',
  }
}

function escapeCSV(value) {
  const text = String(value ?? '')

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function downloadCSV(transactions, summary, periodLabel) {
  const rows = []

  rows.push(['MONEYTRACK'])
  rows.push(['Laporan Keuangan', periodLabel])
  rows.push([])
  rows.push(['Ringkasan'])
  rows.push(['Total Pemasukan', summary.income])
  rows.push(['Total Pengeluaran', summary.expense])
  rows.push(['Saldo Bersih', summary.balance])
  rows.push(['Jumlah Transaksi', summary.count])
  rows.push([])

  rows.push([
    'Tanggal',
    'Jenis',
    'Kategori',
    'Nominal',
    'Catatan',
  ])

  transactions.forEach((transaction) => {
    rows.push([
      transaction.transaction_date,
      transaction.type === 'income'
        ? 'Pemasukan'
        : 'Pengeluaran',
      transaction.categories?.name || 'Tanpa kategori',
      Number(transaction.amount),
      transaction.note || '',
    ])
  })

  const csv = rows
    .map((row) =>
      row.map((cell) => escapeCSV(cell)).join(',')
    )
    .join('\n')

  // BOM supaya Excel membaca UTF-8 dengan benar
  const blob = new Blob(
    ['\uFEFF' + csv],
    {
      type: 'text/csv;charset=utf-8;',
    }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `moneytrack-laporan-${periodLabel
    .toLowerCase()
    .replace(/\s+/g, '-')}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function downloadPDF(transactions, summary, periodLabel, expenseByCategory) {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()

  // =========================
  // HEADER
  // =========================

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MoneyTrack', 14, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Laporan Keuangan', 14, 27)

  doc.setFontSize(10)
  doc.text(periodLabel, pageWidth - 14, 20, {
    align: 'right',
  })

  doc.setDrawColor(220, 220, 220)
  doc.line(14, 32, pageWidth - 14, 32)

  // =========================
  // RINGKASAN
  // =========================

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan Keuangan', 14, 43)

  const summaryY = 50

  const boxes = [
    {
      label: 'Pemasukan',
      value: formatIDR(summary.income),
    },
    {
      label: 'Pengeluaran',
      value: formatIDR(summary.expense),
    },
    {
      label: 'Saldo Bersih',
      value: formatIDR(summary.balance),
    },
    {
      label: 'Transaksi',
      value: String(summary.count),
    },
  ]

  const boxWidth = (pageWidth - 28 - 18) / 4

  boxes.forEach((box, index) => {
    const x = 14 + index * (boxWidth + 6)

    doc.setFillColor(248, 250, 249)
    doc.roundedRect(
      x,
      summaryY,
      boxWidth,
      25,
      3,
      3,
      'F'
    )

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(box.label, x + 5, summaryY + 8)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(
      box.value,
      x + 5,
      summaryY + 18
    )
  })

  // =========================
  // KATEGORI
  // =========================

  let currentY = 85

  if (expenseByCategory.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(
      'Pengeluaran Berdasarkan Kategori',
      14,
      currentY
    )

    currentY += 7

    const categoryRows = expenseByCategory.map(
      (category, index) => {
        const percentage =
          summary.expense > 0
            ? (category.amount /
                summary.expense) *
              100
            : 0

        return [
          index + 1,
          category.name,
          formatIDR(category.amount),
          `${percentage.toFixed(1)}%`,
        ]
      }
    )

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          '#',
          'Kategori',
          'Jumlah',
          'Persentase',
        ],
      ],
      body: categoryRows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [40, 90, 70],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 12 },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    })

    currentY =
      doc.lastAutoTable.finalY + 15
  }

  // =========================
  // DETAIL TRANSAKSI
  // =========================

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(
    'Detail Transaksi',
    14,
    currentY
  )

  currentY += 7

  const transactionRows = transactions.map(
    (transaction) => [
      transaction.transaction_date
        ? transaction.transaction_date
            .split('-')
            .reverse()
            .join('/')
        : '-',

      transaction.type === 'income'
        ? 'Pemasukan'
        : 'Pengeluaran',

      transaction.categories?.name ||
        'Tanpa kategori',

      transaction.note || '-',

      `${transaction.type === 'income' ? '+' : '-'}${formatIDR(
        Number(transaction.amount)
      )}`,
    ]
  )

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Tanggal',
        'Jenis',
        'Kategori',
        'Catatan',
        'Nominal',
      ],
    ],
    body: transactionRows,
    theme: 'striped',

    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: [40, 90, 70],
      textColor: 255,
      fontStyle: 'bold',
    },

    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 27 },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: {
        cellWidth: 30,
        halign: 'right',
      },
    },
  })

  // =========================
  // FOOTER
  // =========================

  const pageCount =
    doc.internal.getNumberOfPages()

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    doc.setPage(page)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    doc.setTextColor(120, 120, 120)

    doc.text(
      `MoneyTrack • Laporan Keuangan`,
      14,
      doc.internal.pageSize.getHeight() - 10
    )

    doc.text(
      `Halaman ${page} dari ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      {
        align: 'right',
      }
    )
  }

  // =========================
  // DOWNLOAD
  // =========================

  const filename = `moneytrack-laporan-${periodLabel
    .toLowerCase()
    .replace(/\s+/g, '-')}.pdf`

  doc.save(filename)
}

export default function Reports() {
  const { transactions, loading, error } = useTransactions()

  const [period, setPeriod] = useState('this-month')

  const defaultDates = getPeriodDates('this-month')

  const [customStart, setCustomStart] = useState(
    defaultDates.start
  )

  const [customEnd, setCustomEnd] = useState(
    defaultDates.end
  )

  const selectedDates = useMemo(() => {
    if (period === 'custom') {
      return {
        start: customStart,
        end: customEnd,
      }
    }

    return getPeriodDates(period)
  }, [period, customStart, customEnd])

  const filteredTransactions = useMemo(() => {
    if (!selectedDates.start || !selectedDates.end) {
      return []
    }

    return transactions
      .filter((transaction) => {
        const date = transaction.transaction_date

        return (
          date >= selectedDates.start &&
          date <= selectedDates.end
        )
      })
      .sort((a, b) =>
        b.transaction_date.localeCompare(
          a.transaction_date
        )
      )
  }, [transactions, selectedDates])

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === 'income'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      )

    const expense = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      )

    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    }
  }, [filteredTransactions])

  const expenseByCategory = useMemo(() => {
    const grouped = {}

    filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .forEach((transaction) => {
        const category =
          transaction.categories?.name ||
          'Tanpa kategori'

        if (!grouped[category]) {
          grouped[category] = 0
        }

        grouped[category] += Number(
          transaction.amount
        )
      })

    return Object.entries(grouped)
      .map(([name, amount]) => ({
        name,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredTransactions])

  const periodLabel =
    REPORT_PERIODS.find(
      (item) => item.key === period
    )?.label || 'Laporan'

 function handleExportPDF() {
  downloadPDF(
    filteredTransactions,
    summary,
    periodLabel,
    expenseByCategory
  )
}

function handleExportCSV() {
  downloadCSV(
    filteredTransactions,
    summary,
    periodLabel
  )
}

  return (
    <AppShell>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-forest-500 dark:text-gold" />

              <h1 className="font-display text-2xl font-semibold">
                Laporan
              </h1>
            </div>

            <p className="text-sm text-ink-soft">
              Buat dan export laporan keuanganmu.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={
                loading ||
                filteredTransactions.length === 0
              }
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>

            <button
              onClick={handleExportCSV}
              disabled={
                loading ||
                filteredTransactions.length === 0
              }
              className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-forest-500 dark:text-gold" />

            <div>
              <h2 className="font-display font-semibold">
                Periode Laporan
              </h2>

              <p className="text-xs text-ink-soft mt-0.5">
                Pilih rentang waktu laporan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REPORT_PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  period === item.key
                    ? 'border-forest-500 bg-forest-50 text-forest-500 shadow-sm dark:border-gold dark:bg-gold/10 dark:text-gold'
                    : 'border-paper-line bg-paper-card text-ink-soft hover:text-ink hover:border-forest-300 dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label
                  htmlFor="report-start"
                  className="label"
                >
                  Dari tanggal
                </label>

                <input
                  id="report-start"
                  type="date"
                  value={customStart}
                  onChange={(e) =>
                    setCustomStart(e.target.value)
                  }
                  className="input"
                />
              </div>

              <div>
                <label
                  htmlFor="report-end"
                  className="label"
                >
                  Sampai tanggal
                </label>

                <input
                  id="report-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) =>
                    setCustomEnd(e.target.value)
                  }
                  className="input"
                />
              </div>
            </div>
          )}

          {selectedDates.start &&
            selectedDates.end && (
              <div className="mt-4 rounded-xl bg-paper px-3 py-2.5 dark:bg-white/5">
                <p className="text-xs text-ink-soft">
                  Periode laporan
                </p>

                <p className="text-sm font-medium mt-0.5">
                  {formatDateDisplay(selectedDates.start)}
                  {' — '}
                  {formatDateDisplay(selectedDates.end)}
                </p>
              </div>
            )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl bg-loss-soft px-4 py-3 text-sm text-loss">
            Gagal mengambil data transaksi.
          </div>
        )}

        {/* SUMMARY */}
        <div>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold">
                Ringkasan Keuangan
              </h2>

              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                Gambaran transaksi pada periode yang dipilih.
              </p>
            </div>

            <span className="hidden sm:inline-flex rounded-full bg-paper px-3 py-1 text-xs text-ink-soft dark:bg-white/5">
              {summary.count} transaksi
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            {/* PEMASUKAN */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm text-ink-soft">
                  Pemasukan
                </span>

                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-gain-soft flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gain" />
                </div>
              </div>

              <p className="font-display text-base sm:text-xl font-semibold text-gain break-words">
                {formatIDR(summary.income)}
              </p>

              <p className="text-[10px] sm:text-xs text-ink-soft mt-1.5">
                Uang masuk
              </p>
            </div>

            {/* PENGELUARAN */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm text-ink-soft">
                  Pengeluaran
                </span>

                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-loss-soft flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-loss" />
                </div>
              </div>

              <p className="font-display text-base sm:text-xl font-semibold text-loss break-words">
                {formatIDR(summary.expense)}
              </p>

              <p className="text-[10px] sm:text-xs text-ink-soft mt-1.5">
                Uang keluar
              </p>
            </div>

            {/* SALDO */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm text-ink-soft">
                  Saldo Bersih
                </span>

                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-forest-50 flex items-center justify-center dark:bg-white/5">
                  <Wallet className="h-4 w-4 text-forest-500 dark:text-gold" />
                </div>
              </div>

              <p
                className={`font-display text-base sm:text-xl font-semibold break-words ${
                  summary.balance >= 0
                    ? 'text-gain'
                    : 'text-loss'
                }`}
              >
                {formatIDR(summary.balance)}
              </p>

              <p className="text-[10px] sm:text-xs text-ink-soft mt-1.5">
                Pemasukan − pengeluaran
              </p>
            </div>

            {/* TRANSAKSI */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm text-ink-soft">
                  Transaksi
                </span>

                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-paper flex items-center justify-center dark:bg-white/5">
                  <Receipt className="h-4 w-4 text-ink-soft" />
                </div>
              </div>

              <p className="font-display text-xl sm:text-2xl font-semibold">
                {summary.count}
              </p>

              <p className="text-[10px] sm:text-xs text-ink-soft mt-1.5">
                Total transaksi
              </p>
            </div>
          </div>
        </div>

        {/* EXPENSE CATEGORY */}
        <div className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-paper-line dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-loss-soft flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-loss" />
                  </div>

                  <h2 className="font-display font-semibold">
                    Pengeluaran berdasarkan kategori
                  </h2>
                </div>

                <p className="text-xs text-ink-soft mt-2 ml-10">
                  Kategori dengan pengeluaran terbesar pada periode ini.
                </p>
              </div>

              {expenseByCategory.length > 0 && (
                <span className="hidden sm:inline-flex rounded-full bg-paper px-3 py-1 text-xs text-ink-soft dark:bg-white/5 whitespace-nowrap">
                  {expenseByCategory.length} kategori
                </span>
              )}
            </div>
          </div>

          {expenseByCategory.length === 0 ? (
            <div className="px-5 py-10 sm:py-12 text-center">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-paper flex items-center justify-center dark:bg-white/5 mb-3">
                <TrendingDown className="h-5 w-5 text-ink-soft/50" />
              </div>

              <p className="text-sm font-medium">
                Belum ada pengeluaran
              </p>

              <p className="text-xs text-ink-soft mt-1 max-w-xs mx-auto">
                Tidak ada data pengeluaran pada periode yang dipilih.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5">
              {expenseByCategory.map((category, index) => {
                const percentage =
                  summary.expense > 0
                    ? (category.amount / summary.expense) * 100
                    : 0

                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-paper text-[11px] font-semibold text-ink-soft dark:bg-white/5">
                          {index + 1}
                        </span>

                        <span className="text-sm font-medium truncate">
                          {category.name}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {formatIDR(category.amount)}
                        </p>

                        <p className="text-[10px] text-ink-soft">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-paper overflow-hidden dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-forest-500 dark:bg-gold transition-all duration-500"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* TRANSACTIONS */}
        <div className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-paper-line dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-forest-50 flex items-center justify-center dark:bg-white/5">
                  <ArrowDownToLine className="h-4 w-4 text-forest-500 dark:text-gold" />
                </div>

                <div>
                  <h2 className="font-display font-semibold">
                    Detail Transaksi
                  </h2>

                  <p className="text-xs text-ink-soft mt-1">
                    Semua transaksi pada periode yang dipilih.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-paper px-3 py-1 text-xs text-ink-soft dark:bg-white/5">
                {filteredTransactions.length} transaksi
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center">
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-forest-200 border-t-forest-500 animate-spin dark:border-white/10 dark:border-t-gold" />

              <p className="text-sm text-ink-soft mt-4">
                Memuat laporan...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-paper flex items-center justify-center dark:bg-white/5 mb-3">
                <FileText className="h-5 w-5 text-ink-soft/50" />
              </div>

              <p className="text-sm font-medium">
                Belum ada transaksi
              </p>

              <p className="text-xs text-ink-soft mt-1 max-w-xs mx-auto">
                Tidak ada transaksi pada periode yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-paper-line bg-paper/40 text-left dark:border-white/10 dark:bg-white/[0.02]">
                    <th className="px-5 py-3.5 font-medium text-ink-soft">
                      Tanggal
                    </th>

                    <th className="px-5 py-3.5 font-medium text-ink-soft">
                      Jenis
                    </th>

                    <th className="px-5 py-3.5 font-medium text-ink-soft">
                      Kategori
                    </th>

                    <th className="px-5 py-3.5 font-medium text-ink-soft">
                      Catatan
                    </th>

                    <th className="px-5 py-3.5 font-medium text-ink-soft text-right">
                      Nominal
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const isIncome =
                      transaction.type === 'income'

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-paper-line/70 last:border-0 hover:bg-paper/40 dark:border-white/5 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          {formatDateDisplay(
                            transaction.transaction_date
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              isIncome
                                ? 'bg-gain-soft text-gain'
                                : 'bg-loss-soft text-loss'
                            }`}
                          >
                            {isIncome ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}

                            {isIncome
                              ? 'Pemasukan'
                              : 'Pengeluaran'}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {transaction.categories?.name ||
                            'Tanpa kategori'}
                        </td>

                        <td className="px-5 py-4 text-ink-soft max-w-[260px] truncate">
                          {transaction.note || '-'}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-semibold whitespace-nowrap ${
                            isIncome
                              ? 'text-gain'
                              : 'text-loss'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatIDR(
                            Number(transaction.amount)
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="rounded-2xl border border-paper-line bg-paper/50 px-4 py-4 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-xs text-ink-soft">
            Laporan dibuat berdasarkan data transaksi MoneyTrack
            pada periode yang dipilih.
          </p>
        </div>

      </div>
    </AppShell>
  )
}