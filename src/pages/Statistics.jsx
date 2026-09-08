import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
} from 'lucide-react'

import AppShell from '../components/AppShell'
import EmptyState from '../components/EmptyState'
import { useTransactions } from '../hooks/useTransactions'
import { getRangeForPeriod, isWithinRange } from '../utils/period'
import { formatIDR } from '../utils/format'
import { CATEGORY_COLORS } from '../utils/categories'

const PERIODS = [
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' },
]

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export default function Statistics() {
  const { transactions, loading } = useTransactions()

  const [period, setPeriod] = useState('monthly')

  const currentYear = new Date().getFullYear()

  const [comparisonYear, setComparisonYear] = useState(
    currentYear
  )

  const { start, end } = getRangeForPeriod(period)

  // ==========================================
  // TRANSAKSI SESUAI PERIODE
  // ==========================================

  const periodTx = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinRange(
          t.transaction_date,
          start,
          end
        )
      ),
    [transactions, start, end]
  )

  // ==========================================
  // TOTAL PEMASUKAN
  // ==========================================

  const income = periodTx
    .filter((t) => t.type === 'income')
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

  // ==========================================
  // TOTAL PENGELUARAN
  // ==========================================

  const expense = periodTx
    .filter((t) => t.type === 'expense')
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

  // ==========================================
  // SALDO
  // ==========================================

  const balance = income - expense

  // ==========================================
  // DATA KATEGORI PENGELUARAN
  // ==========================================

  const categoryData = useMemo(() => {
    const map = new Map()

    periodTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name =
          t.categories?.name ?? 'Lainnya'

        map.set(
          name,
          (map.get(name) ?? 0) +
            Number(t.amount)
        )
      })

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [periodTx])

  // ==========================================
  // PERBANDINGAN BULANAN
  // ==========================================

  const monthlyComparison = useMemo(() => {
    return MONTHS.map((month, index) => {
      const monthNumber = index + 1

      const monthTransactions =
        transactions.filter((t) => {
          if (!t.transaction_date) {
            return false
          }

          const date = new Date(
            `${t.transaction_date}T00:00:00`
          )

          return (
            date.getFullYear() ===
              comparisonYear &&
            date.getMonth() + 1 ===
              monthNumber
          )
        })

      const monthlyIncome =
        monthTransactions
          .filter(
            (t) => t.type === 'income'
          )
          .reduce(
            (sum, t) =>
              sum + Number(t.amount),
            0
          )

      const monthlyExpense =
        monthTransactions
          .filter(
            (t) => t.type === 'expense'
          )
          .reduce(
            (sum, t) =>
              sum + Number(t.amount),
            0
          )

      return {
        month,
        income: monthlyIncome,
        expense: monthlyExpense,
        balance:
          monthlyIncome -
          monthlyExpense,
      }
    })
  }, [transactions, comparisonYear])

  // ==========================================
  // TAHUN YANG TERSEDIA
  // ==========================================

  const availableYears = useMemo(() => {
    const years = new Set()

    transactions.forEach((t) => {
      if (!t.transaction_date) {
        return
      }

      const date = new Date(
        `${t.transaction_date}T00:00:00`
      )

      const year = date.getFullYear()

      if (!Number.isNaN(year)) {
        years.add(year)
      }
    })

    years.add(currentYear)

    return Array.from(years).sort(
      (a, b) => b - a
    )
  }, [transactions, currentYear])

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div>
          <div className="flex items-start gap-3">

            <div
              className="
                flex
                h-10
                w-10
                sm:h-11
                sm:w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                sm:rounded-2xl
                bg-forest-50
                text-forest-500
                dark:bg-forest-500/10
                dark:text-gold
              "
            >
              <BarChart3 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  font-display
                  text-2xl
                  sm:text-3xl
                  font-semibold
                "
              >
                Statistik Keuangan
              </h1>

              <p className="text-sm text-ink-soft mt-1">
                Lihat perkembangan pemasukan
                dan pengeluaranmu.
              </p>
            </div>

          </div>
        </div>


        {/* ==========================================
            FILTER PERIODE
        ========================================== */}

        <div>
          <div
            className="
              grid
              grid-cols-3
              w-full
              sm:inline-flex
              sm:w-auto
              rounded-2xl
              sm:rounded-full
              bg-paper-card
              border
              border-paper-line
              p-1
            "
          >
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() =>
                  setPeriod(p.key)
                }
                className={`
                  px-2.5
                  sm:px-4
                  py-2
                  rounded-xl
                  sm:rounded-full
                  text-xs
                  sm:text-sm
                  font-medium
                  transition-all
                  ${
                    period === p.key
                      ? `
                        bg-forest-500
                        text-white
                        shadow-sm
                      `
                      : `
                        text-ink-soft
                        hover:text-ink
                        hover:bg-paper
                      `
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>


        {/* ==========================================
            RINGKASAN
        ========================================== */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-3
            sm:gap-4
          "
        >

          {/* PEMASUKAN */}

          <div className="card p-4 sm:p-5">
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-3
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-ink-soft
                "
              >
                Total Pemasukan
              </p>

              <div
                className="
                  h-8
                  w-8
                  rounded-xl
                  bg-gain-soft
                  text-gain
                  flex
                  items-center
                  justify-center
                  shrink-0
                  dark:bg-gain/10
                "
              >
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <p
              className="
                font-display
                text-xl
                sm:text-2xl
                font-semibold
                text-gain
                tabular-nums
                break-all
              "
            >
              {formatIDR(income)}
            </p>
          </div>


          {/* PENGELUARAN */}

          <div className="card p-4 sm:p-5">
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-3
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-ink-soft
                "
              >
                Total Pengeluaran
              </p>

              <div
                className="
                  h-8
                  w-8
                  rounded-xl
                  bg-loss-soft
                  text-loss
                  flex
                  items-center
                  justify-center
                  shrink-0
                  dark:bg-loss/10
                "
              >
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>

            <p
              className="
                font-display
                text-xl
                sm:text-2xl
                font-semibold
                text-loss
                tabular-nums
                break-all
              "
            >
              {formatIDR(expense)}
            </p>
          </div>


          {/* SALDO */}

          <div className="card p-4 sm:p-5">
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-3
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-ink-soft
                "
              >
                Saldo Bersih
              </p>

              <div
                className="
                  h-8
                  w-8
                  rounded-xl
                  bg-forest-50
                  text-forest-500
                  flex
                  items-center
                  justify-center
                  shrink-0
                  dark:bg-forest-500/10
                  dark:text-gold
                "
              >
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <p
              className={`
                font-display
                text-xl
                sm:text-2xl
                font-semibold
                tabular-nums
                break-all
                ${
                  balance >= 0
                    ? 'text-gain'
                    : 'text-loss'
                }
              `}
            >
              {formatIDR(balance)}
            </p>
          </div>

        </div>


        {/* ==========================================
            PERBANDINGAN BULANAN
        ========================================== */}

        <div
          className="
            card
            p-4
            sm:p-6
            overflow-hidden
          "
        >

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              justify-between
              gap-4
              mb-5
            "
          >

            <div className="min-w-0">

              <div className="flex items-center gap-2">
                <CalendarDays
                  className="
                    h-4
                    w-4
                    text-forest-500
                    dark:text-gold
                    shrink-0
                  "
                />

                <h2
                  className="
                    font-display
                    text-lg
                    font-semibold
                  "
                >
                  Perbandingan Bulanan
                </h2>
              </div>

              <p
                className="
                  text-sm
                  text-ink-soft
                  mt-1
                "
              >
                Bandingkan pemasukan dan
                pengeluaran selama tahun{' '}
                {comparisonYear}.
              </p>

            </div>


            <select
              value={comparisonYear}
              onChange={(e) =>
                setComparisonYear(
                  Number(e.target.value)
                )
              }
              className="
                input
                w-full
                sm:w-auto
              "
            >
              {availableYears.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

          </div>


          {/* CHART */}

          <div
            className="
              h-72
              sm:h-80
              w-full
              min-w-0
            "
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={monthlyComparison}
                margin={{
                  top: 10,
                  right: 4,
                  left: -12,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="opacity-50"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />

                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `${(
                          value / 1000000
                        ).toFixed(1)}jt`
                      : value >= 1000
                        ? `${Math.round(
                            value / 1000
                          )}rb`
                        : value
                  }
                />

                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    formatIDR(value),
                    name === 'income'
                      ? 'Pemasukan'
                      : 'Pengeluaran',
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border:
                      '1px solid rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: '11px',
                    paddingTop: '10px',
                  }}
                  formatter={(value) =>
                    value === 'income'
                      ? 'Pemasukan'
                      : 'Pengeluaran'
                  }
                />

                <Bar
                  dataKey="income"
                  fill="#2F9E6E"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={24}
                />

                <Bar
                  dataKey="expense"
                  fill="#C0483F"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={24}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>


        {/* ==========================================
            TABEL RINGKASAN BULANAN
        ========================================== */}

        <div
          className="
            card
            overflow-hidden
          "
        >

          <div
            className="
              p-4
              sm:p-5
              border-b
              border-paper-line
            "
          >

            <div className="flex items-center gap-2">

              <CalendarDays
                className="
                  h-4
                  w-4
                  text-forest-500
                  dark:text-gold
                "
              />

              <h2
                className="
                  font-display
                  text-lg
                  font-semibold
                "
              >
                Ringkasan {comparisonYear}
              </h2>

            </div>

            <p
              className="
                text-xs
                sm:text-sm
                text-ink-soft
                mt-1
              "
            >
              Detail pemasukan, pengeluaran,
              dan saldo setiap bulan.
            </p>

          </div>


          <div className="overflow-x-auto">

            <table
              className="
                w-full
                text-sm
                min-w-[580px]
              "
            >

              <thead>

                <tr
                  className="
                    border-b
                    border-paper-line
                    text-left
                    bg-paper/50
                  "
                >

                  <th
                    className="
                      px-4
                      sm:px-5
                      py-3
                      font-semibold
                      text-ink-soft
                    "
                  >
                    Bulan
                  </th>

                  <th
                    className="
                      px-4
                      sm:px-5
                      py-3
                      font-semibold
                      text-ink-soft
                      text-right
                    "
                  >
                    Pemasukan
                  </th>

                  <th
                    className="
                      px-4
                      sm:px-5
                      py-3
                      font-semibold
                      text-ink-soft
                      text-right
                    "
                  >
                    Pengeluaran
                  </th>

                  <th
                    className="
                      px-4
                      sm:px-5
                      py-3
                      font-semibold
                      text-ink-soft
                      text-right
                    "
                  >
                    Saldo
                  </th>

                </tr>

              </thead>


              <tbody>

                {monthlyComparison.map(
                  (month) => (
                    <tr
                      key={month.month}
                      className="
                        border-b
                        border-paper-line
                        last:border-0
                        hover:bg-paper/40
                        transition-colors
                      "
                    >

                      <td
                        className="
                          px-4
                          sm:px-5
                          py-3
                          font-medium
                        "
                      >
                        {month.month}
                      </td>

                      <td
                        className="
                          px-4
                          sm:px-5
                          py-3
                          font-mono
                          text-gain
                          text-right
                          whitespace-nowrap
                        "
                      >
                        {formatIDR(
                          month.income
                        )}
                      </td>

                      <td
                        className="
                          px-4
                          sm:px-5
                          py-3
                          font-mono
                          text-loss
                          text-right
                          whitespace-nowrap
                        "
                      >
                        {formatIDR(
                          month.expense
                        )}
                      </td>

                      <td
                        className={`
                          px-4
                          sm:px-5
                          py-3
                          font-mono
                          font-semibold
                          text-right
                          whitespace-nowrap
                          ${
                            month.balance >= 0
                              ? 'text-gain'
                              : 'text-loss'
                          }
                        `}
                      >
                        {formatIDR(
                          month.balance
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ==========================================
            PENGELUARAN PER KATEGORI
        ========================================== */}

        <div>

          <div className="mb-4">

            <h2
              className="
                font-display
                text-lg
                font-semibold
              "
            >
              Pengeluaran per Kategori
            </h2>

            <p
              className="
                text-sm
                text-ink-soft
                mt-1
              "
            >
              Lihat kategori mana yang paling
              banyak menghabiskan uangmu.
            </p>

          </div>


          {loading ? (

            <div
              className="
                card
                p-8
                text-center
                text-sm
                text-ink-soft
              "
            >
              <div
                className="
                  mx-auto
                  mb-3
                  h-6
                  w-6
                  rounded-full
                  border-2
                  border-paper-line
                  border-t-forest-500
                  animate-spin
                "
              />

              Memuat statistik…
            </div>

          ) : categoryData.length === 0 ? (

            <EmptyState
              title="Belum ada data pengeluaran"
              description="
                Tambahkan pengeluaran pada periode
                ini untuk melihat statistiknya.
              "
            />

          ) : (

            <div
              className="
                grid
                lg:grid-cols-2
                gap-4
              "
            >

              {/* ==================================
                  PIE CHART
              ================================== */}

              <div
                className="
                  card
                  p-4
                  sm:p-5
                  overflow-hidden
                "
              >

                <p
                  className="
                    text-sm
                    font-semibold
                    mb-2
                  "
                >
                  Distribusi Kategori
                </p>

                <p
                  className="
                    text-xs
                    text-ink-soft
                    mb-2
                  "
                >
                  Proporsi pengeluaran berdasarkan
                  kategori.
                </p>


                <div
                  className="
                    h-60
                    sm:h-72
                    w-full
                    min-w-0
                  "
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="52%"
                        outerRadius="78%"
                        paddingAngle={2}
                      >

                        {categoryData.map(
                          (_, i) => (
                            <Cell
                              key={i}
                              fill={
                                CATEGORY_COLORS[
                                  i %
                                    CATEGORY_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>


                      <Tooltip
                        formatter={(value) =>
                          formatIDR(value)
                        }
                        contentStyle={{
                          borderRadius: '12px',
                          border:
                            '1px solid rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />

                    </PieChart>

                  </ResponsiveContainer>

                </div>


                {/* LEGEND */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                    mt-3
                  "
                >

                  {categoryData.map(
                    (category, i) => (
                      <div
                        key={category.name}
                        className="
                          flex
                          items-center
                          gap-2
                          text-xs
                          min-w-0
                        "
                      >

                        <span
                          className="
                            h-2.5
                            w-2.5
                            rounded-full
                            shrink-0
                          "
                          style={{
                            background:
                              CATEGORY_COLORS[
                                i %
                                  CATEGORY_COLORS.length
                              ],
                          }}
                        />

                        <span
                          className="
                            truncate
                            flex-1
                          "
                        >
                          {category.name}
                        </span>

                        <span
                          className="
                            font-mono
                            text-ink-soft
                            whitespace-nowrap
                          "
                        >
                          {formatIDR(
                            category.value
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>


              {/* ==================================
                  BAR CHART
              ================================== */}

              <div
                className="
                  card
                  p-4
                  sm:p-5
                  overflow-hidden
                "
              >

                <p
                  className="
                    text-sm
                    font-semibold
                    mb-2
                  "
                >
                  Perbandingan Pengeluaran
                </p>

                <p
                  className="
                    text-xs
                    text-ink-soft
                    mb-2
                  "
                >
                  Urutan kategori berdasarkan
                  jumlah pengeluaran.
                </p>


                <div
                  className="w-full min-w-0"
                  style={{
                    height: Math.max(
                      280,
                      categoryData.length * 46
                    ),
                  }}
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{
                        top: 8,
                        left: 0,
                        right: 12,
                        bottom: 8,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        className="opacity-50"
                      />

                      <XAxis
                        type="number"
                        tickFormatter={(value) => {
                          if (
                            value >= 1000000
                          ) {
                            return `${(
                              value / 1000000
                            ).toFixed(1)}jt`
                          }

                          if (
                            value >= 1000
                          ) {
                            return `${Math.round(
                              value / 1000
                            )}rb`
                          }

                          return value
                        }}
                        tick={{
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={76}
                        tick={{
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatIDR(value)
                        }
                        contentStyle={{
                          borderRadius: '12px',
                          border:
                            '1px solid rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill="#1F3A34"
                        radius={[
                          0,
                          6,
                          6,
                          0,
                        ]}
                        maxBarSize={24}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>
    </AppShell>
  )
}