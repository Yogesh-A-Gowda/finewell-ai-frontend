import { useEffect, useState } from 'react'
import { getTransactions, addTransaction, deleteTransaction } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react'

const CATEGORIES = ['food', 'transport', 'utilities', 'rent', 'emi', 'shopping', 'medical', 'education', 'entertainment', 'salary', 'upi_received', 'other']

function fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }
const DATE_FMT = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const EMPTY_FORM = { amount: '', transaction_type: 'debit', category: 'other', description: '', upi_ref: '', is_penalty: false }

export default function Transactions() {
  const { refreshUser } = useAuth()
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () =>
    getTransactions({ limit: 100 })
      .then((r) => setTxns(r.data))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      await addTransaction({ ...form, amount: parseFloat(form.amount) })
      await load()
      await refreshUser()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    await deleteTransaction(id)
    await load()
    await refreshUser()
  }

  const filtered = filter === 'all' ? txns : txns.filter((t) => t.transaction_type === filter)

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{txns.length} recorded</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add form — slides in */}
      {showForm && (
        <div className="card border border-blue-200 bg-blue-50 relative">
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
          <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base">New Transaction</h3>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 mb-3 text-sm">{formError}</div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
              <input className="input" type="number" placeholder="500" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="input" value={form.transaction_type}
                onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="debit">Debit (Money Out)</option>
                <option value="credit">Credit (Money In)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input className="input" placeholder="Swiggy, EMI, salary..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="penalty" checked={form.is_penalty}
                onChange={(e) => setForm({ ...form, is_penalty: e.target.checked })} />
              <label htmlFor="penalty" className="text-sm text-gray-700">Penalty charge</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button className="btn-primary flex-1 py-2.5 text-sm" type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Transaction'}
              </button>
              <button className="btn-secondary flex-1 text-sm" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {['all', 'credit', 'debit'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          No transactions yet. Tap <strong>Add</strong> to record your first one.
        </div>
      ) : (
        <>
          {/* ── Mobile / Tablet: card list (hidden on lg+) ── */}
          <div className="lg:hidden space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="card flex items-start gap-3 py-3 px-4">
                <div className="mt-0.5 shrink-0">
                  {t.transaction_type === 'credit'
                    ? <ArrowUpCircle size={20} className="text-green-500" />
                    : <ArrowDownCircle size={20} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 truncate">
                      {t.description || t.category}
                    </span>
                    {t.is_penalty && <span className="badge-high">Penalty</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{t.category}</span>
                    <span>{DATE_FMT(t.date)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Balance after: {fmt(t.balance_after)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`font-bold text-sm ${t.transaction_type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.transaction_type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: table (hidden below lg) ── */}
          <div className="hidden lg:block card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{DATE_FMT(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.transaction_type === 'credit'
                          ? <ArrowUpCircle size={15} className="text-green-500 shrink-0" />
                          : <ArrowDownCircle size={15} className="text-red-400 shrink-0" />}
                        <span className="truncate max-w-[180px]">{t.description || t.category}</span>
                        {t.is_penalty && <span className="badge-high">Penalty</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{t.category}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.transaction_type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.transaction_type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(t.balance_after)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(t.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
