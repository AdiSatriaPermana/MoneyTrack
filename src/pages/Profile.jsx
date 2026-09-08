import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  UserRound,
  Mail,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/format'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pengguna'

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          Profil
        </h1>

        <p className="text-sm text-ink-soft mt-1">
          Kelola informasi akun MoneyTrack kamu.
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="card max-w-lg overflow-hidden">
        {/* PROFILE HEADER */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-2xl bg-forest-50 text-forest-500 dark:bg-forest-500/10 flex items-center justify-center shrink-0">
              <UserRound
                className="h-8 w-8"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p className="font-display text-xl font-semibold truncate">
                {displayName}
              </p>

              <p className="text-sm text-ink-soft truncate mt-0.5">
                {user?.email}
              </p>

              <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-gain">
                <ShieldCheck className="h-3.5 w-3.5" />
                Akun terdaftar
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="border-t border-paper-line">
          <div className="px-5 sm:px-6 pt-5 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Informasi Akun
            </p>
          </div>

          <div className="px-5 sm:px-6 pb-5">
            {/* EMAIL */}
            <div className="flex items-center gap-3 py-3">
              <div className="h-9 w-9 rounded-xl bg-paper flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-ink-soft" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-ink-soft">
                  Email
                </p>

                <p className="text-sm font-medium truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* JOIN DATE */}
            {user?.created_at && (
              <div className="flex items-center gap-3 py-3 border-t border-paper-line">
                <div className="h-9 w-9 rounded-xl bg-paper flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-ink-soft" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-ink-soft">
                    Bergabung sejak
                  </p>

                  <p className="text-sm font-medium mt-0.5">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-paper-line p-5 sm:p-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-loss-soft text-loss font-semibold px-5 py-3 text-sm hover:bg-loss-soft/80 active:scale-[0.99] transition-all"
          >
            <LogOut className="h-4 w-4" />
            Keluar dari akun
          </button>
        </div>
      </div>
    </AppShell>
  )
}