import { useEffect, useState } from 'react'
import Notification from '../components/Notification'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Receipt,
  Lightbulb,
} from 'lucide-react'

import AppShell from '../components/AppShell'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import TransactionModal from '../components/TransactionModal'

import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'

import {
  getRangeForPeriod,
  isWithinRange,
} from '../utils/period'

import {
  formatIDR,
  formatDate,
} from '../utils/format'

const PERIODS = [
  {
    key: 'weekly',
    label: 'Minggu ini',
  },
  {
    key: 'monthly',
    label: 'Bulan ini',
  },
  {
    key: 'yearly',
    label: 'Tahun ini',
  },
]

export default function Dashboard() {
  const { user } = useAuth()

  const {
    transactions,
    loading,
    error,
    addTransaction,
  } = useTransactions()

  const {
    incomeCategories,
    expenseCategories,
    addCategory,
  } = useCategories()

  const [period, setPeriod] = useState('monthly')
  const [modalType, setModalType] = useState(null)

  // ============================================================
  // NOTIFICATION
  // ============================================================

  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
  })

  function showNotification(type, title, message) {
    setNotification({
      show: true,
      type,
      title,
      message,
    })
  }

  function closeNotification() {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }))
  }

  // ============================================================
  // NAMA USER
  // ============================================================

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pengguna'

  // ============================================================
  // NOTIFIKASI SELAMAT DATANG
  // ============================================================

  useEffect(() => {
    const shouldShowWelcome =
      sessionStorage.getItem('moneytrack_login_success')

    if (shouldShowWelcome === 'true') {
      showNotification(
        'success',
        'Berhasil masuk 👋',
        `Selamat datang kembali di MoneyTrack, ${displayName}.`
      )

      sessionStorage.removeItem(
        'moneytrack_login_success'
      )
    }
  }, [displayName])

  // ============================================================
  // DATA PERIODE
  // ============================================================

  const { start, end } =
    getRangeForPeriod(period)

  const periodTx = transactions.filter(
    (transaction) =>
      isWithinRange(
        transaction.transaction_date,
        start,
        end
      )
  )

  // ============================================================
  // TOTAL PEMASUKAN
  // ============================================================

  const periodIncome = periodTx
    .filter(
      (transaction) =>
        transaction.type === 'income'
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    )

  // ============================================================
  // TOTAL PENGELUARAN
  // ============================================================

  const periodExpense = periodTx
    .filter(
      (transaction) =>
        transaction.type === 'expense'
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    )

  // ============================================================
  // SALDO BERSIH
  // ============================================================

  const periodBalance =
    periodIncome - periodExpense

  // ============================================================
  // JUMLAH TRANSAKSI
  // ============================================================

  const transactionCount =
    periodTx.length

  // ============================================================
  // PENGELUARAN BERDASARKAN KATEGORI
  // ============================================================

  const expenseByCategory = Object.values(
    periodTx
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .reduce((result, transaction) => {
        const categoryName =
          transaction.categories?.name ||
          'Tanpa kategori'

        if (!result[categoryName]) {
          result[categoryName] = {
            name: categoryName,
            amount: 0,
          }
        }

        result[categoryName].amount +=
          Number(transaction.amount)

        return result
      }, {})
  )
    .sort(
      (a, b) =>
        b.amount - a.amount
    )
    .slice(0, 6)

  // ============================================================
  // PENGELUARAN TERBESAR
  // ============================================================

  const highestExpenseCategory =
    expenseByCategory[0] ?? null

  const highestExpenseAmount =
    highestExpenseCategory?.amount ?? 0

  // ============================================================
  // PERSENTASE KATEGORI
  // ============================================================

  const getCategoryPercentage = (
    amount
  ) => {
    if (periodExpense <= 0) {
      return 0
    }

    return Math.round(
      (amount / periodExpense) * 100
    )
  }

  // ============================================================
  // TRANSAKSI TERBARU
  // ============================================================

  const recent =
    transactions.slice(0, 5)

  // ============================================================
  // TAMBAH TRANSAKSI
  // ============================================================

  async function handleAddTransaction(
    payload
  ) {
    let categoryId =
      payload.category_id

    if (payload.custom_category) {
      const newCategory =
        await addCategory({
          name: payload.custom_category,
          type: payload.type,
        })

      categoryId =
        newCategory.id
    }

    await addTransaction({
      ...payload,
      category_id: categoryId,
    })

    showNotification(
      'success',
      payload.type === 'income'
        ? 'Pemasukan berhasil ditambahkan 🎉'
        : 'Pengeluaran berhasil ditambahkan 💸',
      payload.type === 'income'
        ? 'Pemasukan berhasil disimpan ke MoneyTrack.'
        : 'Pengeluaran berhasil disimpan ke MoneyTrack.'
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell>

      {/* ======================================================
          NOTIFICATION
      ====================================================== */}

      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

        <div className="min-w-0">
          <p className="text-sm text-ink-soft mb-1">
            Halo, {displayName} 👋
          </p>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            Ringkasan Keuangan
          </h1>

          <p className="text-sm text-ink-soft mt-1">
            Pantau kondisi keuanganmu dengan mudah.
          </p>
        </div>

        {/* ====================================================
            TOMBOL AKSI
        ==================================================== */}

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">

          {/* PENGELUARAN */}

          <button
            type="button"
            className="btn-danger w-full sm:w-auto px-3.5 sm:px-5 py-2.5 text-sm"
            onClick={() =>
              setModalType('expense')
            }
          >
            <TrendingDown
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span className="ml-1">
              Pengeluaran
            </span>
          </button>

          {/* PEMASUKAN */}

          <button
            type="button"
            className="btn-primary w-full sm:w-auto px-3.5 sm:px-5 py-2.5 text-sm"
            onClick={() =>
              setModalType('income')
            }
          >
            <TrendingUp
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span className="ml-1">
              Pemasukan
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <p className="text-sm text-loss bg-loss-soft rounded-xl px-3.5 py-2.5 mb-4 border border-loss/10">
          {error}
        </p>
      )}

      {/* ======================================================
          FILTER PERIODE
      ====================================================== */}

      <div className="w-full sm:w-fit rounded-xl sm:rounded-full bg-paper-card border border-paper-line dark:border-white/10 p-1 mb-5">

        <div className="grid grid-cols-3 sm:flex">

          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() =>
                setPeriod(p.key)
              }
              className={`px-2.5 sm:px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                period === p.key
                  ? 'bg-forest-500 text-white shadow-sm dark:bg-gold dark:text-[#102019]'
                  : 'text-ink-soft hover:text-ink hover:bg-paper dark:hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}

        </div>
      </div>

      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">

        {/* SALDO BERSIH */}

        <StatCard
          label="Saldo Bersih"
          amount={periodBalance}
          tone="neutral"
          icon={Wallet}
        />

        {/* PEMASUKAN */}

        <StatCard
          label="Pemasukan"
          amount={periodIncome}
          tone="gain"
          icon={TrendingUp}
        />

        {/* PENGELUARAN */}

        <StatCard
          label="Pengeluaran"
          amount={periodExpense}
          tone="loss"
          icon={TrendingDown}
        />

        {/* JUMLAH TRANSAKSI */}

        <div className="card p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5">

          <div className="flex items-center gap-2.5 sm:gap-3">

            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-paper dark:bg-white/5 flex items-center justify-center shrink-0">
              <Receipt
                className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-ink-soft"
              />
            </div>

            <div className="min-w-0">

              <p className="text-xs sm:text-sm text-ink-soft">
                Transaksi
              </p>

              <p className="font-display text-xl sm:text-2xl font-semibold mt-0.5">
                {transactionCount}
              </p>

              <p className="text-[10px] sm:text-xs text-ink-soft mt-0.5 truncate">
                transaksi periode ini
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          GRID ANALISIS
      ====================================================== */}

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8">

        {/* ====================================================
            PENGELUARAN PER KATEGORI
        ==================================================== */}

        <div className="card p-4 sm:p-5">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold">
                Pengeluaran per Kategori
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

            <div className="space-y-5">

              {expenseByCategory.map(
                (category) => {

                  const percentage =
                    getCategoryPercentage(
                      category.amount
                    )

                  return (
                    <div
                      key={category.name}
                    >

                      <div className="flex items-center justify-between gap-3 mb-1.5">

                        <div className="flex items-center gap-2 min-w-0">

                          <span className="h-2.5 w-2.5 rounded-full bg-forest-500 dark:bg-gold shrink-0" />

                          <span className="text-sm font-medium truncate">
                            {category.name}
                          </span>

                        </div>

                        <div className="flex items-center gap-2 shrink-0">

                          <span className="text-xs text-ink-soft">
                            {percentage}%
                          </span>

                          <span className="font-mono text-xs sm:text-sm font-semibold">
                            {formatIDR(
                              category.amount
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="h-2 bg-paper dark:bg-white/10 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-forest-500 dark:bg-gold rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </div>

        {/* ====================================================
            INSIGHT
        ==================================================== */}

        <div className="card p-4 sm:p-5">

          <div className="flex items-center gap-3 mb-5">

            <div className="h-10 w-10 rounded-xl bg-paper dark:bg-white/5 flex items-center justify-center shrink-0">

              <Lightbulb
                className="h-5 w-5 text-forest-500 dark:text-gold"
              />

            </div>

            <div>

              <h2 className="font-display text-base sm:text-lg font-semibold">
                Insight Keuangan
              </h2>

              <p className="text-xs text-ink-soft mt-1">
                Ringkasan dari data periode ini
              </p>

            </div>

          </div>

          {periodTx.length === 0 ? (

            <div className="rounded-xl bg-paper dark:bg-white/5 p-4">

              <p className="text-sm text-ink-soft">
                Belum cukup data untuk memberikan insight.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {/* INSIGHT 1 */}

              <div className="rounded-xl bg-paper dark:bg-white/5 p-4">

                <p className="text-xs text-ink-soft mb-1">
                  Pengeluaran terbesar
                </p>

                {highestExpenseCategory ? (

                  <>
                    <p className="font-semibold">
                      {highestExpenseCategory.name}
                    </p>

                    <p className="text-sm text-ink-soft mt-1">
                      {formatIDR(
                        highestExpenseAmount
                      )}
                      {' '}atau{' '}
                      {getCategoryPercentage(
                        highestExpenseAmount
                      )}
                      % dari total pengeluaran.
                    </p>
                  </>

                ) : (

                  <p className="text-sm text-ink-soft">
                    Belum ada pengeluaran.
                  </p>

                )}

              </div>

              {/* INSIGHT 2 */}

              <div className="rounded-xl bg-paper dark:bg-white/5 p-4">

                <p className="text-xs text-ink-soft mb-1">
                  Kondisi saldo
                </p>

                {periodBalance > 0 ? (

                  <p className="text-sm">
                    👍 Pemasukanmu lebih besar
                    daripada pengeluaran sebesar{' '}
                    <span className="font-semibold">
                      {formatIDR(
                        periodBalance
                      )}
                    </span>
                    .
                  </p>

                ) : periodBalance < 0 ? (

                  <p className="text-sm">
                    ⚠️ Pengeluaranmu lebih besar
                    daripada pemasukan sebesar{' '}
                    <span className="font-semibold">
                      {formatIDR(
                        Math.abs(
                          periodBalance
                        )
                      )}
                    </span>
                    .
                  </p>

                ) : (

                  <p className="text-sm">
                    Pemasukan dan pengeluaranmu
                    seimbang pada periode ini.
                  </p>

                )}

              </div>

              {/* INSIGHT 3 */}

              <div className="rounded-xl bg-paper dark:bg-white/5 p-4">

                <p className="text-xs text-ink-soft mb-1">
                  Aktivitas
                </p>

                <p className="text-sm">
                  Kamu mencatat{' '}
                  <span className="font-semibold">
                    {transactionCount}
                  </span>{' '}
                  transaksi pada periode ini.
                </p>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* ======================================================
          TRANSAKSI TERBARU
      ====================================================== */}

      <div className="flex items-center justify-between gap-3 mb-4">

        <div className="min-w-0">

          <h2 className="font-display text-lg font-semibold">
            Transaksi Terbaru
          </h2>

          <p className="text-xs text-ink-soft mt-1">
            Aktivitas transaksi terakhir
          </p>

        </div>

        <Link
          to="/transaksi"
          className="text-xs sm:text-sm font-medium text-forest-500 dark:text-gold hover:underline flex items-center gap-1 shrink-0"
        >
          Lihat semua

          <ArrowRight
            className="h-3.5 w-3.5"
          />
        </Link>

      </div>

      {/* ======================================================
          TRANSACTION STATE
      ====================================================== */}

      {loading ? (

        <div className="card p-8 text-center text-sm text-ink-soft">
          Memuat transaksi…
        </div>

      ) : recent.length === 0 ? (

        <EmptyState
          title="Belum ada transaksi"
          description="Mulai catat pemasukan atau pengeluaran pertamamu."
          action={
            <button
              type="button"
              onClick={() =>
                setModalType('income')
              }
              className="btn-primary text-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </button>
          }
        />

      ) : (

        <div className="card overflow-hidden">

          <div className="divide-y divide-paper-line dark:divide-white/10">

            {recent.map((t) => (

              <div
                key={t.id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors hover:bg-paper/60 dark:hover:bg-white/[0.03]"
              >

                {/* ICON */}

                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    t.type === 'income'
                      ? 'bg-gain-soft'
                      : 'bg-loss-soft'
                  }`}
                >

                  {t.type === 'income' ? (

                    <TrendingUp
                      className="h-4 w-4 text-gain"
                    />

                  ) : (

                    <TrendingDown
                      className="h-4 w-4 text-loss"
                    />

                  )}

                </div>

                {/* INFO */}

                <div className="flex-1 min-w-0">

                  <p className="font-medium text-sm truncate">
                    {t.categories?.name ??
                      'Tanpa kategori'}
                  </p>

                  <p className="text-[11px] sm:text-xs text-ink-soft mt-0.5 truncate">

                    {formatDate(
                      t.transaction_date
                    )}

                    {t.note
                      ? ` · ${t.note}`
                      : ''}

                  </p>

                </div>

                {/* NOMINAL */}

                <p
                  className={`font-mono text-xs sm:text-sm font-semibold tabular-nums shrink-0 ${
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

              </div>

            ))}

          </div>

        </div>

      )}

      {/* ======================================================
          MODAL PEMASUKAN
      ====================================================== */}

      <TransactionModal
        open={modalType === 'income'}
        onClose={() =>
          setModalType(null)
        }
        onSubmit={handleAddTransaction}
        type="income"
        categories={incomeCategories}
      />

      {/* ======================================================
          MODAL PENGELUARAN
      ====================================================== */}

      <TransactionModal
        open={modalType === 'expense'}
        onClose={() =>
          setModalType(null)
        }
        onSubmit={handleAddTransaction}
        type="expense"
        categories={expenseCategories}
      />

    </AppShell>
  )
}