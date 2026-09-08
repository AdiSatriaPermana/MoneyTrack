import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react'

import AppShell from '../components/AppShell'
import { useTransactions } from '../hooks/useTransactions'
import { formatIDR, formatDate } from '../utils/format'

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const DAYS = [
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
  'Min',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()

  // JavaScript:
  // Minggu = 0
  // Senin = 1
  //
  // Kita ubah supaya:
  // Senin = 0
  // ...
  // Minggu = 6

  return day === 0 ? 6 : day - 1
}

function getDateKey(year, month, day) {
  const monthString = String(month + 1).padStart(2, '0')
  const dayString = String(day).padStart(2, '0')

  return `${year}-${monthString}-${dayString}`
}

export default function Calendar() {
  const { transactions, loading, error } = useTransactions()

  const today = new Date()

  const [currentDate, setCurrentDate] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  )

  const [selectedDate, setSelectedDate] = useState(
    getDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // ============================================================
  // TRANSAKSI BULAN INI
  // ============================================================

  const monthTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (!transaction.transaction_date) {
        return false
      }

      const date = new Date(
        `${transaction.transaction_date}T00:00:00`
      )

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      )
    })
  }, [transactions, year, month])

  // ============================================================
  // TRANSAKSI BERDASARKAN TANGGAL
  // ============================================================

  const transactionsByDate = useMemo(() => {
    const grouped = {}

    monthTransactions.forEach((transaction) => {
      const dateKey = transaction.transaction_date

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }

      grouped[dateKey].push(transaction)
    })

    return grouped
  }, [monthTransactions])

  // ============================================================
  // TOTAL BULAN
  // ============================================================

  const monthIncome = monthTransactions
    .filter(
      (transaction) =>
        transaction.type === 'income'
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    )

  const monthExpense = monthTransactions
    .filter(
      (transaction) =>
        transaction.type === 'expense'
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    )

  const monthBalance =
    monthIncome - monthExpense

  // ============================================================
  // TANGGAL YANG DIPILIH
  // ============================================================

  const selectedTransactions =
    transactionsByDate[selectedDate] || []

  const selectedIncome =
    selectedTransactions
      .filter(
        (transaction) =>
          transaction.type === 'income'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      )

  const selectedExpense =
    selectedTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense'
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      )

  const selectedBalance =
    selectedIncome - selectedExpense

  // ============================================================
  // NAVIGASI BULAN
  // ============================================================

  function previousMonth() {
    setCurrentDate(
      new Date(year, month - 1, 1)
    )
  }

  function nextMonth() {
    setCurrentDate(
      new Date(year, month + 1, 1)
    )
  }

  function goToToday() {
    const todayDate = new Date()

    setCurrentDate(
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1
      )
    )

    setSelectedDate(
      getDateKey(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate()
      )
    )
  }

  // ============================================================
  // KALENDER
  // ============================================================

  const daysInMonth =
    getDaysInMonth(year, month)

  const firstDay =
    getFirstDayOfMonth(year, month)

  const calendarDays = []

  // Hari kosong sebelum tanggal 1
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Tanggal bulan
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(day)
  }

  // ============================================================
  // CEK HARI INI
  // ============================================================

  const todayKey = getDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  // ============================================================
  // FORMAT TANGGAL TERPILIH
  // ============================================================

  function formatSelectedDate() {
    if (!selectedDate) {
      return 'Pilih tanggal'
    }

    const date = new Date(
      `${selectedDate}T00:00:00`
    )

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(date)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">

        <div className="flex items-center gap-3 mb-1">

          <div
            className="
              h-10
              w-10
              rounded-xl
              bg-forest-50
              dark:bg-forest-500/10
              flex
              items-center
              justify-center
            "
          >
            <CalendarDays
              className="
                h-5
                w-5
                text-forest-500
                dark:text-gold
              "
            />
          </div>

          <div>

            <h1
              className="
                font-display
                text-2xl
                sm:text-3xl
                font-semibold
              "
            >
              Kalender Keuangan
            </h1>

            <p className="text-sm text-ink-soft mt-1">
              Lihat kapan pemasukan dan pengeluaranmu terjadi.
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <p
          className="
            text-sm
            text-loss
            bg-loss-soft
            rounded-lg
            px-3.5
            py-2.5
            mb-4
          "
        >
          {error}
        </p>
      )}


      {/* ======================================================
          RINGKASAN BULAN
      ====================================================== */}

    <div 
      className="
      grid 
      sm:grid-cols-3 
      gap-3 
      sm:gap-4 
      mb-5 
      sm:mb-6
    "
    >

        {/* PEMASUKAN */}

        <div className="card p-4 sm:p-5">

          <div className="flex items-center gap-3">

            <div
              className="
                h-10
                w-10
                rounded-xl
                bg-gain-soft
                dark:bg-gain/10
                flex
                items-center
                justify-center
              "
            >
              <TrendingUp
                className="h-5 w-5 text-gain"
              />
            </div>

            <div>

              <p className="text-xs text-ink-soft">
                Pemasukan bulan ini
              </p>

              <p
                className="
                  font-mono
                  text-lg
                  font-semibold
                  text-gain
                  mt-0.5
                "
              >
                {formatIDR(monthIncome)}
              </p>

            </div>

          </div>

        </div>


        {/* PENGELUARAN */}

        <div className="card p-5">

          <div className="flex items-center gap-3">

            <div
              className="
                h-10
                w-10
                rounded-xl
                bg-loss-soft
                dark:bg-loss/10
                flex
                items-center
                justify-center
              "
            >
              <TrendingDown
                className="h-5 w-5 text-loss"
              />
            </div>

            <div>

              <p className="text-xs text-ink-soft">
                Pengeluaran bulan ini
              </p>

              <p
                className="
                  font-mono
                  text-lg
                  font-semibold
                  text-loss
                  mt-0.5
                "
              >
                {formatIDR(monthExpense)}
              </p>

            </div>

          </div>

        </div>


        {/* SALDO */}

        <div className="card p-5">

          <div className="flex items-center gap-3">

            <div
              className="
                h-10
                w-10
                rounded-xl
                bg-paper
                flex
                items-center
                justify-center
              "
            >
              <Wallet
                className="
                  h-5
                  w-5
                  text-forest-500
                  dark:text-gold
                "
              />
            </div>

            <div>

              <p className="text-xs text-ink-soft">
                Selisih bulan ini
              </p>

              <p
                className={`
                  font-mono
                  text-lg
                  font-semibold
                  mt-0.5
                  ${
                    monthBalance >= 0
                      ? 'text-gain'
                      : 'text-loss'
                  }
                `}
              >
                {monthBalance >= 0
                  ? '+'
                  : '−'}

                {formatIDR(
                  Math.abs(monthBalance)
                )}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          MAIN GRID
      ====================================================== */}

<div 
  className="
    grid 
    lg:grid-cols-[1.5fr_1fr] 
    gap-4 
    sm:gap-6 
    items-start
  "
>

        {/* ====================================================
            CALENDAR
        ==================================================== */}

        <div className="card p-3 sm:p-6">

          {/* HEADER BULAN */}

          <div
className="
  flex 
  items-center 
  justify-between
  mb-4 
  sm:mb-5
"
          >

            <button
              type="button"
              onClick={previousMonth}
              className="
                h-9
                w-9
                rounded-lg
                border
                border-paper-line
                bg-paper-card
                flex
                items-center
                justify-center
                hover:bg-paper
                transition-colors
              "
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>


            <div className="text-center">

              <h2
                className="
                  font-display
                  text-base
                  sm:text-xl
                  font-semibold
                "
              >
                {MONTHS[month]} {year}
              </h2>

              <button
                type="button"
                onClick={goToToday}
                className="
                  text-xs
                  text-forest-500
                  dark:text-gold
                  font-medium
                  hover:underline
                  mt-0.5
                "
              >
                Kembali ke hari ini
              </button>

            </div>


            <button
              type="button"
              onClick={nextMonth}
              className="
                h-9
                w-9
                rounded-lg
                border
                border-paper-line
                bg-paper-card
                flex
                items-center
                justify-center
                hover:bg-paper
                transition-colors
              "
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>


          {/* NAMA HARI */}

          <div
            className="
              grid
              grid-cols-7
              mb-2
            "
          >

            {DAYS.map((day) => (
              <div
                key={day}
className="
  text-center 
  text-[10px] 
  sm:text-xs 
  font-semibold 
  text-ink-soft 
  py-1.5 
  sm:py-2
"
              >
                {day}
              </div>
            ))}

          </div>


          {/* GRID TANGGAL */}

          {loading ? (

            <div
              className="
                py-16
                text-center
                text-sm
                text-ink-soft
              "
            >
              Memuat kalender…
            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-7
                gap-1
              "
            >

              {calendarDays.map(
                (day, index) => {

                  if (day === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="
                          min-h-[56px]
                          sm:min-h-[88px]
                        "
                      />
                    )
                  }

                  const dateKey =
                    getDateKey(
                      year,
                      month,
                      day
                    )

                  const dayTransactions =
                    transactionsByDate[
                      dateKey
                    ] || []

                  const hasIncome =
                    dayTransactions.some(
                      (transaction) =>
                        transaction.type ===
                        'income'
                    )

                  const hasExpense =
                    dayTransactions.some(
                      (transaction) =>
                        transaction.type ===
                        'expense'
                    )

                  const isSelected =
                    selectedDate === dateKey

                  const isToday =
                    todayKey === dateKey

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() =>
                        setSelectedDate(
                          dateKey
                        )
                      }
                      className={`
                        relative
                        min-h-[56px]
                        sm:min-h-[88px]
rounded-lg 
sm:rounded-xl 
p-1.5 
sm:p-2 
text-left 
border
                        transition-all
                        ${
                          isSelected
                            ? `
                              border-forest-500
                              bg-forest-50
                              dark:bg-forest-500/10
                            `
                            : `
                              border-transparent
                              hover:border-paper-line
                              hover:bg-paper
                            `
                        }
                      `}
                    >

                      {/* NOMOR TANGGAL */}

                      <div className="flex items-center justify-between">

                        <span
                          className={`
                            h-6 
w-6 
sm:h-7 
sm:w-7 
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-xs
                            font-semibold
                            ${
                              isToday
                                ? `
                                  bg-forest-500
                                  text-white
                                `
                                : ''
                            }
                          `}
                        >
                          {day}
                        </span>

                      </div>


                      {/* INDIKATOR */}

                      {dayTransactions.length > 0 && (

                        <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">

                          {hasIncome && (
                            <div
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >
                              <span
                                className="
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  bg-gain
                                "
                              />

                              <span
                                className="
                                  hidden
                                  sm:block
                                  text-[10px]
                                  text-gain
                                  font-medium
                                "
                              >
                                Masuk
                              </span>
                            </div>
                          )}

                          {hasExpense && (
                            <div
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >
                              <span
                                className="
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  bg-loss
                                "
                              />

                              <span
                                className="
                                  hidden
                                  sm:block
                                  text-[10px]
                                  text-loss
                                  font-medium
                                "
                              >
                                Keluar
                              </span>
                            </div>
                          )}

                        </div>

                      )}

                    </button>
                  )
                }
              )}

            </div>

          )}


          {/* LEGEND */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-4
              mt-5
              pt-4
              border-t
              border-paper-line
            "
          >

            <div className="flex items-center gap-2">

              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-gain
                "
              />

              <span className="text-xs text-ink-soft">
                Pemasukan
              </span>

            </div>

            <div className="flex items-center gap-2">

              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-loss
                "
              />

              <span className="text-xs text-ink-soft">
                Pengeluaran
              </span>

            </div>

            <div className="flex items-center gap-2">

              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-forest-500
                "
              />

              <span className="text-xs text-ink-soft">
                Hari ini
              </span>

            </div>

          </div>

        </div>


        {/* ====================================================
            DETAIL TANGGAL
        ==================================================== */}

        <div className="card p-4 sm:p-6">

          <div className="mb-5">

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                font-semibold
                text-forest-500
                dark:text-gold
                mb-1
              "
            >
              Detail tanggal
            </p>

            <h2
              className="
                font-display
                text-xl
                font-semibold
              "
            >
              {formatSelectedDate()}
            </h2>

          </div>


          {/* RINGKASAN HARI */}

          <div
grid 
grid-cols-2 
gap-2 
sm:gap-3 
mb-4 
sm:mb-5
          >

            <div
              className="
                rounded-xl
                bg-gain-soft
                dark:bg-gain/10
                p-3
              "
            >

              <p
                className="
                  text-xs
                  text-gain
                  font-medium
                "
              >
                Pemasukan
              </p>

              <p
                className="
                  font-mono
                  text-sm
                  font-semibold
                  text-gain
                  mt-1
                "
              >
                {formatIDR(selectedIncome)}
              </p>

            </div>


            <div
              className="
                rounded-xl
                bg-loss-soft
                dark:bg-loss/10
                p-3
              "
            >

              <p
                className="
                  text-xs
                  text-loss
                  font-medium
                "
              >
                Pengeluaran
              </p>

              <p
                className="
                  font-mono
                  text-sm
                  font-semibold
                  text-loss
                  mt-1
                "
              >
                {formatIDR(selectedExpense)}
              </p>

            </div>

          </div>


          {/* TRANSAKSI */}

          {selectedTransactions.length === 0 ? (

            <div
              className="
                rounded-xl
                bg-paper
                p-6
                text-center
              "
            >

              <CalendarDays
                className="
                  h-8
                  w-8
                  mx-auto
                  text-ink-soft
                  mb-3
                "
              />

              <p className="text-sm font-medium">
                Tidak ada transaksi
              </p>

              <p
                className="
                  text-xs
                  text-ink-soft
                  mt-1
                "
              >
                Tidak ada pemasukan atau pengeluaran
                pada tanggal ini.
              </p>

            </div>

          ) : (

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-3
                "
              >

                <p className="text-sm font-semibold">
                  Transaksi
                </p>

                <span className="text-xs text-ink-soft">
                  {selectedTransactions.length}{' '}
                  transaksi
                </span>

              </div>


              <div className="space-y-1">

                {selectedTransactions.map(
                  (transaction) => (

                    <div
                      key={transaction.id}
                      className="
                        flex
                        items-center
                        gap-3
                        py-3
                        border-b
                        last:border-0
                        border-paper-line
                      "
                    >

                      {/* ICON */}

                      <div
                        className={`
                          h-9
                          w-9
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          shrink-0
                          ${
                            transaction.type ===
                            'income'
                              ? `
                                bg-gain-soft
                                dark:bg-gain/10
                              `
                              : `
                                bg-loss-soft
                                dark:bg-loss/10
                              `
                          }
                        `}
                      >

                        {transaction.type ===
                        'income' ? (

                          <TrendingUp
                            className="
                              h-4
                              w-4
                              text-gain
                            "
                          />

                        ) : (

                          <TrendingDown
                            className="
                              h-4
                              w-4
                              text-loss
                            "
                          />

                        )}

                      </div>


                      {/* INFO */}

                      <div className="flex-1 min-w-0">

                        <p
                          className="
                            text-sm
                            font-medium
                            truncate
                          "
                        >
                          {transaction.categories
                            ?.name ||
                            'Tanpa kategori'}
                        </p>

                        <p
                          className="
                            text-xs
                            text-ink-soft
                            mt-0.5
                            truncate
                          "
                        >
                          {transaction.note
                            ? transaction.note
                            : transaction.type === 'income'
                            ? 'Pemasukan'
                            : 'Pengeluaran'}
                        </p>

                      </div>

                      {/* NOMINAL */}

                      <p
                        className={`
                          font-mono
                          text-sm
                          font-semibold
                          shrink-0
                          ${
                            transaction.type ===
                            'income'
                              ? 'text-gain'
                              : 'text-loss'
                          }
                        `}
                      >

                        {transaction.type ===
                        'income'
                          ? '+'
                          : '−'}

                        {formatIDR(
                          transaction.amount
                        )}

                      </p>

                    </div>

                  )
                )}

              </div>

              {/* SALDO HARI */}

              <div
                className="
                  mt-5
                  pt-4
                  border-t
                  border-paper-line
                  flex
                  items-center
                  justify-between
                "
              >

                <span className="text-sm text-ink-soft">
                  Selisih hari ini
                </span>

                <span
                  className={`
                    font-mono
                    font-semibold
                    ${
                      selectedBalance >= 0
                        ? 'text-gain'
                        : 'text-loss'
                    }
                  `}
                >
                  {selectedBalance >= 0
                    ? '+'
                    : '−'}

                  {formatIDR(
                    Math.abs(
                      selectedBalance
                    )
                  )}
                </span>

              </div>

            </div>

          )}

        </div>

      </div>

    </AppShell>
  )
}