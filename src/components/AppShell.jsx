import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  PieChart,
  UserRound,
  LogOut,
  Coins,
  Moon,
  Sun,
  CalendarDays,
  FileText,
  MoreHorizontal,
  X,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/useTheme'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Ringkasan',
    icon: LayoutDashboard,
  },
  {
    to: '/transaksi',
    label: 'Transaksi',
    icon: ArrowLeftRight,
  },
  {
    to: '/kalender',
    label: 'Kalender',
    icon: CalendarDays,
  },
  {
    to: '/pemasukan',
    label: 'Pemasukan',
    icon: TrendingUp,
  },
  {
    to: '/pengeluaran',
    label: 'Pengeluaran',
    icon: TrendingDown,
  },
  {
    to: '/statistik',
    label: 'Statistik',
    icon: PieChart,
  },
  {
    to: '/laporan',
    label: 'Laporan',
    icon: FileText,
  },
  {
    to: '/profil',
    label: 'Profil',
    icon: UserRound,
  },
]

// Menu utama yang selalu tampil di HP
const MOBILE_MAIN_ITEMS = [
  {
    to: '/dashboard',
    label: 'Ringkasan',
    icon: LayoutDashboard,
  },
  {
    to: '/transaksi',
    label: 'Transaksi',
    icon: ArrowLeftRight,
  },
  {
    to: '/kalender',
    label: 'Kalender',
    icon: CalendarDays,
  },
  {
    to: '/statistik',
    label: 'Statistik',
    icon: PieChart,
  },
]

// Menu yang masuk ke "Lainnya"
const MOBILE_MORE_ITEMS = [
  {
    to: '/pemasukan',
    label: 'Pemasukan',
    icon: TrendingUp,
  },
  {
    to: '/pengeluaran',
    label: 'Pengeluaran',
    icon: TrendingDown,
  },
  {
    to: '/laporan',
    label: 'Laporan',
    icon: FileText,
  },
  {
    to: '/profil',
    label: 'Profil',
    icon: UserRound,
  },
]

export default function AppShell({ children }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [showMore, setShowMore] = useState(false)

  async function handleLogout() {
    setShowMore(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pengguna'

  return (
    <div className="min-h-screen bg-paper dark:bg-[#0F1715] transition-colors duration-300 lg:flex">
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================== */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-paper-line dark:border-white/10 bg-forest-500 dark:bg-[#121E1B] text-white transition-colors duration-300">
        {/* LOGO */}
        <div className="flex items-center px-6 py-6">
          <div className="flex items-center gap-2.5 animate-pulse">
            <Coins
              className="h-6 w-6 text-gold drop-shadow-[0_0_7px_rgba(242,196,80,0.8)]"
              strokeWidth={2}
            />

            <span className="font-display text-xl font-semibold tracking-tight">
              MoneyTrack
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-forest-100 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon
                className="h-4.5 w-4.5"
                strokeWidth={2}
              />

              {label}
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM SIDEBAR */}
        <div className="px-3 pb-6 pt-3 border-t border-white/10">
          <div className="px-3.5 py-2 text-xs text-forest-100/80 truncate">
            Masuk sebagai
            <br />

            <span className="text-white font-medium">
              {displayName}
            </span>
          </div>

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-forest-100 hover:bg-white/5 hover:text-white transition-colors"
          >
            {theme === 'dark' ? (
              <Sun
                className="h-4.5 w-4.5"
                strokeWidth={2}
              />
            ) : (
              <Moon
                className="h-4.5 w-4.5"
                strokeWidth={2}
              />
            )}

            {theme === 'dark'
              ? 'Mode terang'
              : 'Mode gelap'}
          </button>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-forest-100 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut
              className="h-4.5 w-4.5"
              strokeWidth={2}
            />

            Keluar
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* =======================================================
            MOBILE HEADER
        ======================================================== */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-paper-line dark:border-white/10 bg-paper/90 dark:bg-[#0F1715]/90 backdrop-blur px-4 py-3.5">
          {/* LOGO */}
          <div className="flex items-center gap-2 animate-pulse">
            <Coins
              className="h-5 w-5 text-forest-500 dark:text-gold drop-shadow-[0_0_7px_rgba(242,196,80,0.8)]"
              strokeWidth={2}
            />

            <span className="font-display text-lg font-semibold dark:text-white">
              MoneyTrack
            </span>
          </div>

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full flex items-center justify-center border border-paper-line dark:border-white/10 bg-white dark:bg-[#17221F]"
            aria-label="Ganti tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-gold" />
            ) : (
              <Moon className="h-4 w-4 text-forest-500" />
            )}
          </button>
        </header>

        {/* =======================================================
            PAGE CONTENT
        ======================================================== */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8 pb-24 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* =======================================================
            MOBILE MORE BACKDROP
        ======================================================== */}
        {showMore && (
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setShowMore(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />
        )}

        {/* =======================================================
            MOBILE MORE MENU
        ======================================================== */}
        {showMore && (
          <div className="lg:hidden fixed bottom-[68px] left-3 right-3 z-50">
            <div className="rounded-2xl border border-paper-line dark:border-white/10 bg-paper-card dark:bg-[#121E1B] shadow-2xl overflow-hidden">
              {/* MENU HEADER */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-paper-line dark:border-white/10">
                <div>
                  <h2 className="font-display font-semibold">
                    Lainnya
                  </h2>

                  <p className="text-[11px] text-ink-soft mt-0.5">
                    Menu MoneyTrack
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMore(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-paper dark:bg-white/5 text-ink-soft hover:text-ink transition-colors"
                  aria-label="Tutup"
                >
                  <X
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* MORE ITEMS */}
              <div className="p-2">
                {MOBILE_MORE_ITEMS.map(
                  ({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-forest-50 text-forest-500 dark:bg-gold/10 dark:text-gold'
                            : 'text-ink hover:bg-paper dark:text-white dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon
                        className="h-4.5 w-4.5"
                        strokeWidth={2}
                      />

                      {label}
                    </NavLink>
                  )
                )}

                {/* THEME */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-ink hover:bg-paper dark:text-white dark:hover:bg-white/5 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun
                      className="h-4.5 w-4.5 text-gold"
                      strokeWidth={2}
                    />
                  ) : (
                    <Moon
                      className="h-4.5 w-4.5 text-forest-500"
                      strokeWidth={2}
                    />
                  )}

                  {theme === 'dark'
                    ? 'Mode terang'
                    : 'Mode gelap'}
                </button>

                {/* LOGOUT */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-loss hover:bg-loss-soft transition-colors"
                >
                  <LogOut
                    className="h-4.5 w-4.5"
                    strokeWidth={2}
                  />

                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            MOBILE BOTTOM NAV
        ======================================================== */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-[#121E1B] border-t border-paper-line dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-[68px]">
            {/* MAIN ITEMS */}
            {MOBILE_MAIN_ITEMS.map(
              ({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                      isActive
                        ? 'text-forest-500 dark:text-gold'
                        : 'text-ink-soft/70 dark:text-white/50'
                    }`
                  }
                >
                  <Icon
                    className="h-[19px] w-[19px]"
                    strokeWidth={2}
                  />

                  <span>{label}</span>
                </NavLink>
              )
            )}

            {/* MORE BUTTON */}
            <button
              type="button"
              onClick={() =>
                setShowMore((prev) => !prev)
              }
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                showMore
                  ? 'text-forest-500 dark:text-gold'
                  : 'text-ink-soft/70 dark:text-white/50'
              }`}
              aria-label="Lainnya"
              aria-expanded={showMore}
            >
              <MoreHorizontal
                className="h-[20px] w-[20px]"
                strokeWidth={2}
              />

              <span>Lainnya</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}