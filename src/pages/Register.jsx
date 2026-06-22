import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/api'
import { TrendingUp } from 'lucide-react'

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
  { value: 'jan_dhan', label: 'Jan Dhan Account (₹0 min balance)' },
  { value: 'salary', label: 'Salary Account' },
]

const MIN_BALANCES = {
  savings: 1000,
  current: 5000,
  jan_dhan: 0,
  salary: 0,
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    account_type: 'savings',
    minimum_balance: 1000,
    current_balance: '',
    monthly_income: '',
    bank_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleAccountTypeChange = (v) => {
    set('account_type', v)
    set('minimum_balance', MIN_BALANCES[v] || 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        current_balance: parseFloat(form.current_balance) || 0,
        monthly_income: parseFloat(form.monthly_income) || 0,
        minimum_balance: parseFloat(form.minimum_balance) || 0,
      }
      const { data } = await register(payload)
      signIn(data.access_token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 rounded-xl p-2.5">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FinWell AI</h1>
            <p className="text-gray-500 text-sm">Create your free account</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Personal Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input className="input" placeholder="Rahul Sharma" value={form.name}
                  onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input className="input" type="password" placeholder="Min 8 characters" value={form.password}
                  onChange={(e) => set('password', e.target.value)} required minLength={8} />
              </div>
              <button className="btn-primary w-full py-2.5" type="submit">Next →</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Bank Account Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input className="input" placeholder="SBI, HDFC, Kotak..." value={form.bank_name}
                  onChange={(e) => set('bank_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select className="input" value={form.account_type}
                  onChange={(e) => handleAccountTypeChange(e.target.value)}>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Balance (₹)</label>
                  <input className="input" type="number" value={form.minimum_balance}
                    onChange={(e) => set('minimum_balance', e.target.value)} min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance (₹)</label>
                  <input className="input" type="number" placeholder="5000" value={form.current_balance}
                    onChange={(e) => set('current_balance', e.target.value)} required min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
                <input className="input" type="number" placeholder="25000" value={form.monthly_income}
                  onChange={(e) => set('monthly_income', e.target.value)} min={0} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary flex-1 py-2.5" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
