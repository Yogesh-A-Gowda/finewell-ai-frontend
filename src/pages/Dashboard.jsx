import { useEffect, useState } from 'react'
import { getSummary, getHealthScore, getCashflow, getSpendingBreakdown } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Wallet, Activity } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const RISK_COLOR = { High: 'text-red-600', Medium: 'text-yellow-600', Low: 'text-green-600' }
const RISK_BG = { High: 'bg-red-50 border-red-200', Medium: 'bg-yellow-50 border-yellow-200', Low: 'bg-green-50 border-green-200' }

function fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }

function ScoreRing({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const r = 52, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [health, setHealth] = useState(null)
  const [cashflow, setCashflow] = useState([])
  const [spending, setSpending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSummary().then((r) => setSummary(r.data)),
      getHealthScore().then((r) => setHealth(r.data)),
      getCashflow(7).then((r) => setCashflow(r.data)),
      getSpendingBreakdown(30).then((r) => setSpending(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-96">
      <div className="text-blue-600 text-lg animate-pulse">Loading your financial dashboard...</div>
    </div>
  )

  const balanceBuffer = summary?.balance_buffer || 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your financial wellness overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <Wallet size={14} /> Current Balance
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(summary?.current_balance)}</p>
          <p className={`text-xs mt-1 ${balanceBuffer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balanceBuffer >= 0 ? '+' : ''}{fmt(balanceBuffer)} vs min
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <TrendingUp size={14} /> Monthly Income
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(summary?.monthly_income)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <TrendingDown size={14} /> Monthly Expenses
          </div>
          <p className="text-2xl font-bold text-red-500">{fmt(summary?.monthly_expenses)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
            <AlertTriangle size={14} /> Penalty Charges
          </div>
          <p className="text-2xl font-bold text-orange-500">{fmt(summary?.total_penalties_30d)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Health Score + Risk */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card text-center">
            <h3 className="font-semibold text-gray-700 mb-4">Financial Health Score</h3>
            <ScoreRing score={health.health_score} />
            <p className={`mt-3 font-bold text-sm ${RISK_COLOR[health.penalty_risk]}`}>
              Penalty Risk: {health.penalty_risk}
            </p>
          </div>
          <div className={`card border col-span-2 ${RISK_BG[health.penalty_risk]}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className={RISK_COLOR[health.penalty_risk]} />
              <h3 className="font-semibold text-gray-800">AI Analysis</h3>
            </div>
            <p className="text-gray-700 text-sm mb-4">{health.ai_summary}</p>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {health.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span> {r}
                </li>
              ))}
            </ul>
            {health.penalty_savings_potential > 0 && (
              <div className="mt-4 bg-white/60 rounded-lg px-3 py-2 text-sm">
                Potential annual savings: <strong className="text-green-600">{fmt(health.penalty_savings_potential)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Flow Chart */}
      {cashflow.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={16} /> 7-Day Balance Forecast
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="predicted_balance" stroke="#3b82f6" fill="url(#balGrad)"
                name="Predicted Balance" strokeWidth={2} />
              <Area type="monotone" dataKey="confidence_low" stroke="#ef4444" fill="none"
                strokeDasharray="4 4" name="Low Estimate" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
          {summary?.minimum_balance > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Minimum balance threshold: {fmt(summary.minimum_balance)}
            </p>
          )}
        </div>
      )}

      {/* Spending Breakdown */}
      {spending.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Spending by Category (30d)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={spending} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                  label={({ category, percentage }) => `${category} ${percentage}%`}>
                  {spending.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spending} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
