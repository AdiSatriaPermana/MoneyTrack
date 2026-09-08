import { useState } from 'react'
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from 'lucide-react'

import AppShell from '../components/AppShell'
import TransactionTable from '../components/TransactionTable'
import TransactionModal from '../components/TransactionModal'
import ConfirmDialog from '../components/ConfirmDialog'

import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'

export default function Transactions() {
  const {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions()

  const {
    categories,
    incomeCategories,
    expenseCategories,
  } = useCategories()

  const [editing, setEditing] = useState(null)
  const [addType, setAddType] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function handleEdit(transaction) {
    setEditing(transaction)
  }

  async function handleUpdate(payload) {
    await updateTransaction(editing.id, payload)
  }

  async function handleDelete() {
    setDeleting(true)

    try {
      await deleteTransaction(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const categoriesForEdit =
    editing?.type === 'income'
      ? incomeCategories
      : expenseCategories

  return (
    <AppShell>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">

        <div className="min-w-0">

          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-paper dark:bg-white/5 flex items-center justify-center">
              <Receipt
                className="h-4 w-4 text-forest-500 dark:text-gold"
                strokeWidth={2}
              />
            </div>

            <span className="text-xs font-medium text-ink-soft">
              Catatan keuangan
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            Riwayat Transaksi
          </h1>

          <p className="text-sm text-ink-soft mt-1">
            Kelola semua pemasukan dan pengeluaranmu.
          </p>

        </div>

        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}

        <div className="grid grid-cols-2 gap-2.5 w-full lg:w-auto">

          {/* PENGELUARAN */}

          <button
            type="button"
            onClick={() => setAddType('expense')}
            className="btn-danger justify-center text-sm px-3.5 sm:px-5"
          >
            <ArrowDownLeft
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span>
              Pengeluaran
            </span>
          </button>

          {/* PEMASUKAN */}

          <button
            type="button"
            onClick={() => setAddType('income')}
            className="btn-primary justify-center text-sm px-3.5 sm:px-5"
          >
            <ArrowUpRight
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span>
              Pemasukan
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-2.5 text-sm text-loss bg-loss-soft border border-loss/10 rounded-xl px-3.5 py-3 mb-5">
          <span className="mt-0.5 shrink-0">⚠️</span>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* ======================================================
          TRANSACTION COUNT
      ====================================================== */}

      {!loading && transactions.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3">

          <p className="text-xs sm:text-sm text-ink-soft">
            Menampilkan{' '}
            <span className="font-semibold text-ink dark:text-white">
              {transactions.length}
            </span>{' '}
            transaksi
          </p>

        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      {loading ? (

        <div className="card p-10 text-center">

          <div className="flex flex-col items-center">

            <div className="h-10 w-10 rounded-full border-2 border-paper-line dark:border-white/10 border-t-forest-500 dark:border-t-gold animate-spin mb-4" />

            <p className="text-sm text-ink-soft">
              Memuat transaksi…
            </p>

          </div>

        </div>

      ) : (

        <TransactionTable
          transactions={transactions}
          categories={categories}
          onEdit={handleEdit}
          onDelete={setPendingDelete}
        />

      )}

      {/* ======================================================
          MODAL TAMBAH PEMASUKAN
      ====================================================== */}

      <TransactionModal
        open={addType === 'income'}
        onClose={() => setAddType(null)}
        onSubmit={addTransaction}
        type="income"
        categories={incomeCategories}
      />

      {/* ======================================================
          MODAL TAMBAH PENGELUARAN
      ====================================================== */}

      <TransactionModal
        open={addType === 'expense'}
        onClose={() => setAddType(null)}
        onSubmit={addTransaction}
        type="expense"
        categories={expenseCategories}
      />

      {/* ======================================================
          MODAL EDIT
      ====================================================== */}

      <TransactionModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        type={editing?.type}
        categories={categoriesForEdit}
        initialData={editing}
      />

      {/* ======================================================
          KONFIRMASI HAPUS
      ====================================================== */}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus transaksi ini?"
        description="Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />

    </AppShell>
  )
}