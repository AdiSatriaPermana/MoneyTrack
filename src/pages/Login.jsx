import { useState } from 'react'
import Notification from '../components/Notification'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Coins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
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

    if (!email || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      await signIn({
        email,
        password,
      })

      // Simpan tanda login berhasil
      // supaya halaman berikutnya bisa menampilkan
      // notification setelah Login di-unmount.
      sessionStorage.setItem(
        'moneytrack_login_success',
        'true'
      )

      // =================================================
      // NOTIF BERHASIL LOGIN
      // =================================================

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
        err.message?.toLowerCase() || ''

      if (
        message.includes(
          'invalid login credentials'
        )
      ) {
        setError('Email atau password salah.')
      } else if (
        message.includes('fetch')
      ) {
        setError(
          'Terjadi kesalahan koneksi. Coba lagi.'
        )
      } else {
        setError('Email atau password salah.')
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

        {/* NOMINAL UANG */}

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


        {/* TITIK-TITIK KECIL */}

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

        <div className="card login-card p-6 sm:p-8">

          {/* TITLE */}

          <h1 className="font-display text-2xl font-semibold mb-1">
            Selamat datang kembali
          </h1>

          <p className="text-sm text-ink-soft mb-6">
            Masuk untuk melanjutkan pencatatan keuanganmu.
          </p>


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
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="nama@email.com"
                  className="
                    input
                    pl-10
                  "
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

                {/* ICON GEMBOK */}

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


                {/* INPUT PASSWORD */}

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Masukkan password"
                  className="
                    input
                    pl-10
                    pr-11
                  "
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
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-ink-soft
                    hover:text-forest-500
                    dark:hover:text-gold
                    transition-colors
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
              <p
                className="
                  text-sm
                  text-loss
                  bg-loss-soft
                  rounded-lg
                  px-3.5
                  py-2.5
                "
              >
                {error}
              </p>
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
              "
            >

              {loading ? (
                'Memproses…'
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

          <p className="text-sm text-ink-soft text-center mt-6">

            Belum punya akun?{' '}

            <Link
              to="/register"
              className="
                text-forest-500
                dark:text-gain
                font-semibold
                hover:underline
              "
            >
              Daftar sekarang
            </Link>

          </p>

        </div>

      </div>

    </div>
  )
}