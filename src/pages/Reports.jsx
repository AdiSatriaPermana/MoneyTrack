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
<div className="flex flex-col sm:flex-row gap-2">
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
            <CalendarDays className="h-4.5 w-4.5 text-forest-500 dark:text-gold" />
            <h2 className="font-display font-semibold">
              Periode Laporan
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REPORT_PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  period === item.key
                    ? 'border-forest-500 bg-forest-50 text-forest-500 dark:border-gold dark:bg-gold/10 dark:text-gold'
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
              <p className="text-xs text-ink-soft mt-4">
                Periode:{' '}
                <span className="font-medium text-ink">
                  {formatDateDisplay(
                    selectedDates.start
                  )}{' '}
                  —{' '}
                  {formatDateDisplay(
                    selectedDates.end
                  )}
                </span>
              </p>
            )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl bg-loss-soft px-4 py-3 text-sm text-loss">
            Gagal mengambil data transaksi.
          </div>
        )}

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">
                Pemasukan
              </span>

              <div className="h-9 w-9 rounded-xl bg-gain-soft flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-gain" />
              </div>
            </div>

            <p className="font-display text-xl font-semibold text-gain">
              {formatIDR(summary.income)}
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">
                Pengeluaran
              </span>

              <div className="h-9 w-9 rounded-xl bg-loss-soft flex items-center justify-center">
                <TrendingDown className="h-4.5 w-4.5 text-loss" />
              </div>
            </div>

            <p className="font-display text-xl font-semibold text-loss">
              {formatIDR(summary.expense)}
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">
                Saldo Bersih
              </span>

              <div className="h-9 w-9 rounded-xl bg-forest-50 dark:bg-white/5 flex items-center justify-center">
                <Wallet className="h-4.5 w-4.5 text-forest-500 dark:text-gold" />
              </div>
            </div>

            <p
              className={`font-display text-xl font-semibold ${
                summary.balance >= 0
                  ? 'text-gain'
                  : 'text-loss'
              }`}
            >
              {formatIDR(summary.balance)}
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-soft">
                Transaksi
              </span>

              <div className="h-9 w-9 rounded-xl bg-paper dark:bg-white/5 flex items-center justify-center">
                <Receipt className="h-4.5 w-4.5 text-ink-soft" />
              </div>
            </div>

            <p className="font-display text-xl font-semibold">
              {summary.count}
            </p>
          </div>
        </div>

        {/* EXPENSE CATEGORY */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold">
                Pengeluaran berdasarkan kategori
              </h2>

              <p className="text-xs text-ink-soft mt-1">
                Kategori dengan pengeluaran terbesar
              </p>
            </div>
          </div>

          {expenseByCategory.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-soft">
                Belum ada pengeluaran pada periode ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseByCategory.map(
                (category, index) => {
                  const percentage =
                    summary.expense > 0
                      ? (category.amount /
                          summary.expense) *
                        100
                      : 0

                  return (
                    <div key={category.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">
                          {index + 1}. {category.name}
                        </span>

                        <span className="text-sm text-ink-soft">
                          {formatIDR(
                            category.amount
                          )}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-paper dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-forest-500 dark:bg-gold transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-ink-soft mt-1">
                        {percentage.toFixed(1)}% dari
                        total pengeluaran
                      </p>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>

        {/* TRANSACTIONS */}
        <div className="card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-paper-line dark:border-white/10">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-4.5 w-4.5 text-forest-500 dark:text-gold" />

              <div>
                <h2 className="font-display font-semibold">
                  Detail Transaksi
                </h2>

                <p className="text-xs text-ink-soft mt-1">
                  {filteredTransactions.length}{' '}
                  transaksi dalam periode ini
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-ink-soft">
              Memuat laporan...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-8 w-8 mx-auto text-ink-soft/50 mb-3" />

              <p className="text-sm font-medium">
                Belum ada transaksi
              </p>

              <p className="text-xs text-ink-soft mt-1">
                Tidak ada transaksi pada periode yang
                dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper-line dark:border-white/10 text-left">
                    <th className="px-5 py-3 font-medium text-ink-soft">
                      Tanggal
                    </th>

                    <th className="px-5 py-3 font-medium text-ink-soft">
                      Jenis
                    </th>

                    <th className="px-5 py-3 font-medium text-ink-soft">
                      Kategori
                    </th>

                    <th className="px-5 py-3 font-medium text-ink-soft">
                      Catatan
                    </th>

                    <th className="px-5 py-3 font-medium text-ink-soft text-right">
                      Nominal
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction) => {
                      const isIncome =
                        transaction.type === 'income'

                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-paper-line/70 dark:border-white/5 last:border-0"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {formatDateDisplay(
                              transaction.transaction_date
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={
                                isIncome
                                  ? 'text-gain'
                                  : 'text-loss'
                              }
                            >
                              {isIncome
                                ? 'Pemasukan'
                                : 'Pengeluaran'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {transaction.categories
                              ?.name ||
                              'Tanpa kategori'}
                          </td>

                          <td className="px-5 py-3.5 text-ink-soft max-w-[220px] truncate">
                            {transaction.note ||
                              '-'}
                          </td>

                          <td
                            className={`px-5 py-3.5 text-right font-medium whitespace-nowrap ${
                              isIncome
                                ? 'text-gain'
                                : 'text-loss'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatIDR(
                              Number(
                                transaction.amount
                              )
                            )}
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="text-center pb-2">
          <p className="text-xs text-ink-soft">
            Laporan dibuat dari data transaksi
            MoneyTrack pada periode yang dipilih.
          </p>
        </div>
      </div>
    </AppShell>
  )
}