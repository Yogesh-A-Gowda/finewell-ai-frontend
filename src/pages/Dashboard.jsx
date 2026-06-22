import { useEffect, useState } from 'react'
import { getSummary, getHealthScore, getCashflow, getSpendingBreakdown } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Wallet, Activity } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const RISK_COLOR = { High: 'text-red-600', Medium: 'text-yellow-600', Low: 'text-green-600' }
const RISK_BG = { High: 'bg-red-50 border-red-200', Medium: 'bg-yellow-50 border-yellow-200', Low: 'bg-green-50 border-green-200' }

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function ScoreRing({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const r = 48, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
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
    <div className="flex items-center justify-center min-h-64 p-8">
      <div className="text-blue-600 animate-pulse text-base">Loading your dashboard...</div>
    </div>
  )

  const balanceBuffer = summary?.balance_buffer || 0

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Your financial wellness overview</p>
      </div>

      {/* KPI row — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
            <Wallet size={13} /> Balance
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{fmt(summary?.current_balance)}</p>
          <p className={`text-xs mt-1 ${balanceBuffer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balanceBuffer >= 0 ? '+' : ''}{fmt(balanceBuffer)} vs min
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
            <TrendingUp size={13} /> Income
          </div>
          <p className="text-lg md:text-2xl font-bold text-green-600 truncate">{fmt(summary?.monthly_income)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
            <TrendingDown size={13} /> Expenses
          </div>
          <p className="text-lg md:text-2xl font-bold text-red-500 truncate">{fmt(summary?.monthly_expenses)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
            <AlertTriangle size={13} /> Penalties
          </div>
          <p className="text-lg md:text-2xl font-bold text-orange-500 truncate">{fmt(summary?.total_penalties_30d)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Health Score + AI Analysis */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score ring */}
          <div className="card text-center">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Financial Health Score</h3>
            <ScoreRing score={health.health_score} />
            <p className={`mt-3 font-bold text-sm ${RISK_COLOR[health.penalty_risk]}`}>
              Penalty Risk: {health.penalty_risk}
            </p>
          </div>

          {/* AI summary */}
          <div className={`card border lg:col-span-2 ${RISK_BG[health.penalty_risk]}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className={RISK_COLOR[health.penalty_risk]} />
              <h3 className="font-semibold text-gray-800 text-sm md:text-base">AI Analysis</h3>
            </div>
            <p className="text-gray-700 text-sm mb-3">{health.ai_summary}</p>
            <h4 className="font-semibold text-gray-700 text-xs md:text-sm mb-2">Recommendations</h4>
            <ul className="space-y-1.5">
              {health.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-gray-700">
                  <span className="text-blue-600 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {health.penalty_savings_potential > 0 && (
              <div className="mt-3 bg-white/60 rounded-lg px-3 py-2 text-xs md:text-sm">
                Potential annual savings: <strong className="text-green-600">{fmt(health.penalty_savings_potential)}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7-Day Cash Flow Forecast */}
      {cashflow.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm md:text-base">
            <Activity size={15} /> 7-Day Balance Forecast
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="predicted_balance" stroke="#3b82f6"
                fill="url(#balGrad)" name="Balance" strokeWidth={2} />
              <Area type="monotone" dataKey="confidence_low" stroke="#ef4444"
                fill="none" strokeDasharray="4 4" name="Low Est." strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Spending breakdown — stacks on mobile */}
      {spending.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Spending by Category (30d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={spending} dataKey="amount" nameKey="category"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                  labelLine={false}>
                  {spending.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm md:text-base">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spending} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={65} />
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
