import { useState } from 'react'
import Notification from '../components/Notification'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Coins,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // =====================================================
  // NOTIFICATION
  // =====================================================

  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
  })

  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message,
    })
  }

  const closeNotification = () => {
    setNotification({
      show: false,
      type: 'success',
      title: '',
      message: '',
    })
  }

  const from =
    location.state?.from?.pathname || '/dashboard'

  // =====================================================
  // LOGIN
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      await signIn({
        email: trimmedEmail,
        password,
      })

      // Simpan tanda login berhasil
      // agar notification bisa diteruskan ke halaman berikutnya.
      sessionStorage.setItem(
        'moneytrack_login_success',
        'true'
      )

      showNotification(
        'success',
        'Berhasil masuk 👋',
        'Selamat datang kembali di MoneyTrack.'
      )

      // Beri waktu notification terlihat
      // sebelum pindah halaman.
      setTimeout(() => {
        navigate(from, {
          replace: true,
        })
      }, 1200)
    } catch (err) {
      const message =
        err?.message?.toLowerCase() || ''

      if (
        message.includes(
          'invalid login credentials'
        )
      ) {
        setError('Email atau password salah.')
      } else if (
        message.includes('fetch') ||
        message.includes('network')
      ) {
        setError(
          'Terjadi kesalahan koneksi. Coba lagi.'
        )
      } else {
        setError(
          'Email atau password salah.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* =====================================================
          NOTIFICATION
      ====================================================== */}

      {notification.show && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      {/* =====================================================
          BACKGROUND GLOW
      ====================================================== */}

      <div
        className="login-glow login-glow-one"
        aria-hidden="true"
      />

      <div
        className="login-glow login-glow-two"
        aria-hidden="true"
      />

      {/* =====================================================
          FLOATING MONEY
      ====================================================== */}

      <div
        className="login-money-layer"
        aria-hidden="true"
      >
        <span className="login-money income login-money-1">
          Rp250.000 ↑
        </span>

        <span className="login-money income login-money-2">
          Rp75.000 ↑
        </span>

        <span className="login-money expense login-money-3">
          − Rp85.000 ↓
        </span>

        <span className="login-money income login-money-4">
          Rp1.500.000 ↑
        </span>

        <span className="login-money income login-money-5">
          Rp875.000 ↑
        </span>

        <span className="login-money expense login-money-6">
          − Rp50.000 ↓
        </span>

        <span className="login-money income login-money-7">
          Rp320.000 ↑
        </span>

        <span className="login-money expense login-money-8">
          − Rp125.000 ↓
        </span>

        <span className="login-money-dot login-dot-1" />
        <span className="login-money-dot login-dot-2" />
        <span className="login-money-dot login-dot-3" />
        <span className="login-money-dot login-dot-4" />
        <span className="login-money-dot login-dot-5" />
        <span className="login-money-dot login-dot-6" />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="login-content">
        {/* ===================================================
            LOGO
        ==================================================== */}

        <Link
          to="/"
          className="login-logo"
          aria-label="Kembali ke halaman utama MoneyTrack"
        >
          <Coins
            className="login-logo-icon"
            strokeWidth={2}
          />

          <span className="font-display font-semibold">
            MoneyTrack
          </span>
        </Link>

        {/* ===================================================
            LOGIN CARD
        ==================================================== */}

        <div className="card login-card p-5 sm:p-8">
          {/* TITLE */}

          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-[26px] font-semibold leading-tight">
              Selamat datang kembali
            </h1>

            <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
              Masuk untuk melanjutkan pencatatan
              keuanganmu.
            </p>
          </div>

          {/* =================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* =================================================
                EMAIL
            ================================================== */}

            <div>
              <label
                className="label"
                htmlFor="email"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    h-4.5
                    w-4.5
                    text-ink-soft
                    pointer-events-none
                  "
                  strokeWidth={2}
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)

                    if (error) {
                      setError('')
                    }
                  }}
                  placeholder="nama@email.com"
                  className="
                    input
                    pl-10
                  "
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}

            <div>
              <label
                className="label"
                htmlFor="password"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    h-4.5
                    w-4.5
                    text-ink-soft
                    pointer-events-none
                  "
                  strokeWidth={2}
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)

                    if (error) {
                      setError('')
                    }
                  }}
                  placeholder="Masukkan password"
                  className="
                    input
                    pl-10
                    pr-12
                  "
                  disabled={loading}
                  required
                />

                {/* SHOW / HIDE PASSWORD */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="
                    absolute
                    right-1
                    top-1/2
                    -translate-y-1/2
                    h-9
                    w-9
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    text-ink-soft
                    hover:text-forest-500
                    hover:bg-paper
                    dark:hover:text-gold
                    transition-colors
                    disabled:opacity-50
                  "
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      className="h-4.5 w-4.5"
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      className="h-4.5 w-4.5"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div
                role="alert"
                className="
                  rounded-xl
                  bg-loss-soft
                  px-3.5
                  py-3
                  text-sm
                  text-loss
                  border
                  border-loss/10
                "
              >
                {error}
              </div>
            )}

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="
                btn-primary
                login-submit
                w-full
                min-h-11
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      h-4
                      w-4
                      rounded-full
                      border-2
                      border-white/40
                      border-t-white
                      animate-spin
                    "
                  />

                  Memproses…
                </>
              ) : (
                <>
                  Masuk

                  <ArrowRight
                    className="h-4 w-4 ml-1"
                    strokeWidth={2}
                  />
                </>
              )}
            </button>
          </form>

          {/* =================================================
              REGISTER
          ================================================== */}

          <div className="mt-6 pt-5 border-t border-paper-line">
            <p className="text-sm text-ink-soft text-center">
              Belum punya akun?{' '}

              <Link
                to="/register"
                className="
                  text-forest-500
                  dark:text-gain
                  font-semibold
                  hover:underline
                  underline-offset-2
                "
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* SMALL FOOTER */}

        <p className="text-[11px] text-ink-soft/70 text-center mt-4">
          Kelola keuanganmu dengan lebih sederhana.
        </p>
      </div>
    </div>
  )
}