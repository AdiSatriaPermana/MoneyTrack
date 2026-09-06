import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import TransactionTypePage from './pages/TransactionTypePage'
import Statistics from './pages/Statistics'
import Profile from './pages/Profile'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transaksi"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pemasukan"
              element={
                <ProtectedRoute>
                  <TransactionTypePage type="income" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pengeluaran"
              element={
                <ProtectedRoute>
                  <TransactionTypePage type="expense" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/statistik"
              element={
                <ProtectedRoute>
                  <Statistics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kalender"
              element={<Calendar />}
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />

              <Route
  path="/laporan"
  element={
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  }
/>

          </Routes>

          <Analytics />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}