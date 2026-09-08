import { useMemo, useState } from 'react'
import {
  Pencil,
  Trash2,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'

import { formatIDR, formatDate } from '../utils/format'
import EmptyState from './EmptyState'

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  categories = [],
  fixedType,
  showTypeBadge = true,
}) {
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [type, setType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // ============================================================
  // FILTER TRANSAKSI
  // ============================================================

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (fixedType && t.type !== fixedType) {
        return false
      }

      if (
        !fixedType &&
        type !== 'all' &&
        t.type !== type
      ) {
        return false
      }

      if (
        category !== 'all' &&
        t.category_id !== category
      ) {
        return false
      }

      if (
        dateFrom &&
        t.transaction_date < dateFrom
      ) {
        return false
      }

      if (
        dateTo &&
        t.transaction_date > dateTo
      ) {
        return false
      }

      return true
    })
  }, [
    transactions,
    category,
    dateFrom,
    dateTo,
    type,
    fixedType,
  ])

  // ============================================================
  // JUMLAH FILTER AKTIF
  // ============================================================

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (!fixedType && type !== 'all' ? 1 : 0)

  const hasActiveFilters =
    activeFilterCount > 0

  // ============================================================
  // RESET FILTER
  // ============================================================

  function resetFilters() {
    setCategory('all')
    setDateFrom('')
    setDateTo('')
    setType('all')
  }

  return (
    <div className="space-y-4">

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="flex items-center justify-between gap-3">

        <button
          type="button"
          onClick={() =>
            setShowFilters((s) => !s)
          }
          className={`btn-secondary text-xs sm:text-sm transition-all ${
            hasActiveFilters
              ? '!border-forest-500 !text-forest-500 dark:!border-gold dark:!text-gold'
              : ''
          }`}
        >
          <SlidersHorizontal
            className="h-4 w-4"
            strokeWidth={2}
          />

          <span>
            Filter
          </span>

          {hasActiveFilters && (
            <span className="ml-0.5 rounded-full bg-forest-500 text-white dark:bg-gold dark:text-[#102019] px-1.5 py-0.5 text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-ghost text-xs sm:text-sm"
          >
            Reset filter
          </button>
        )}

      </div>

      {/* ======================================================
          FILTER PANEL
      ====================================================== */}

      {showFilters && (
        <div className="card p-4 sm:p-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* JENIS */}

            {!fixedType && (
              <div>
                <label className="label">
                  Jenis
                </label>

                <select
                  className="input"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                >
                  <option value="all">
                    Semua
                  </option>

                  <option value="income">
                    Pemasukan
                  </option>

                  <option value="expense">
                    Pengeluaran
                  </option>
                </select>
              </div>
            )}

            {/* KATEGORI */}

            <div>
              <label className="label">
                Kategori
              </label>

              <select
                className="input"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option value="all">
                  Semua
                </option>

                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DARI */}

            <div>
              <label className="label">
                Dari tanggal
              </label>

              <input
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) =>
                  setDateFrom(e.target.value)
                }
              />
            </div>

            {/* SAMPAI */}

            <div>
              <label className="label">
                Sampai tanggal
              </label>

              <input
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) =>
                  setDateTo(e.target.value)
                }
              />
            </div>

          </div>

          {/* FILTER RESULT */}

          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-paper-line dark:border-white/10">

              <p className="text-xs text-ink-soft">
                Menampilkan{' '}
                <span className="font-semibold text-ink dark:text-white">
                  {filtered.length}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-ink dark:text-white">
                  {transactions.length}
                </span>{' '}
                transaksi
              </p>

            </div>
          )}

        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {filtered.length === 0 ? (

        <EmptyState
          title="Belum ada transaksi"
          description={
            hasActiveFilters
              ? 'Tidak ada transaksi yang cocok dengan filter ini.'
              : 'Transaksi yang kamu tambahkan akan muncul di sini.'
          }
        />

      ) : (

        /* ====================================================
           TRANSACTION LIST
        ==================================================== */

        <div className="card overflow-hidden">

          <div className="divide-y divide-paper-line dark:divide-white/10">

            {filtered.map((t) => (

              <div
                key={t.id}
                className="group flex items-center gap-3 px-3.5 sm:px-5 py-3.5 sm:py-4 transition-colors hover:bg-paper/60 dark:hover:bg-white/[0.03]"
              >

                {/* =================================================
                    ICON TRANSAKSI
                ================================================= */}

                <div
                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    t.type === 'income'
                      ? 'bg-gain-soft'
                      : 'bg-loss-soft'
                  }`}
                >

                  {t.type === 'income' ? (

                    <ArrowUpRight
                      className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-gain"
                      strokeWidth={2}
                    />

                  ) : (

                    <ArrowDownLeft
                      className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-loss"
                      strokeWidth={2}
                    />

                  )}

                </div>

                {/* =================================================
                    INFO
                ================================================= */}

                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">

                    <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-none">
                      {t.categories?.name ??
                        'Tanpa kategori'}
                    </p>

                    {showTypeBadge && (
                      <span
                        className={`inline-flex items-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                          t.type === 'income'
                            ? 'bg-gain-soft text-gain'
                            : 'bg-loss-soft text-loss'
                        }`}
                      >
                        {t.type === 'income'
                          ? 'Masuk'
                          : 'Keluar'}
                      </span>
                    )}

                  </div>

                  <p className="text-[11px] sm:text-xs text-ink-soft mt-0.5 truncate">

                    {formatDate(
                      t.transaction_date
                    )}

                    {t.note
                      ? ` · ${t.note}`
                      : ''}

                  </p>

                </div>

                {/* =================================================
                    NOMINAL
                ================================================= */}

                <p
                  className={`font-mono text-xs sm:text-sm font-semibold tabular-nums text-right shrink-0 ${
                    t.type === 'income'
                      ? 'text-gain'
                      : 'text-loss'
                  }`}
                >
                  {t.type === 'income'
                    ? '+'
                    : '−'}

                  {formatIDR(t.amount)}
                </p>

                {/* =================================================
                    ACTION
                ================================================= */}

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

                  {/* EDIT */}

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(t)
                    }
                    className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-forest-50 hover:text-forest-500 dark:hover:bg-white/5 dark:hover:text-gold transition-colors"
                    aria-label="Edit transaksi"
                  >
                    <Pencil
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      onDelete(t)
                    }
                    className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-loss-soft hover:text-loss transition-colors"
                    aria-label="Hapus transaksi"
                  >
                    <Trash2
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>
  )
}