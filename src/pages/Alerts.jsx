import { useEffect, useState } from 'react'
import { getAlerts, markAlertRead, markAllAlertsRead } from '../services/api'
import { AlertTriangle, Info, CheckCircle, BellOff, CheckCheck } from 'lucide-react'

const ICONS = {
  high: <AlertTriangle size={17} className="text-red-500 shrink-0" />,
  medium: <AlertTriangle size={17} className="text-yellow-500 shrink-0" />,
  low: <Info size={17} className="text-blue-500 shrink-0" />,
}

const TYPE_LABELS = {
  low_balance: 'Low Balance',
  penalty_risk: 'Penalty Risk',
  cash_flow: 'Cash Flow',
  recurring_expense: 'Recurring',
  penalty_charged: 'Penalty',
}

const DATE_FMT = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => getAlerts().then((r) => setAlerts(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleRead = async (id) => {
    await markAlertRead(id)
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a))
  }

  const handleReadAll = async () => {
    await markAllAlertsRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
  }

  const unread = alerts.filter((a) => !a.is_read).length

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleReadAll}
            className="btn-secondary flex items-center gap-2 text-xs md:text-sm">
            <CheckCheck size={15} />
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read all</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-16">
          <BellOff size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">No alerts yet</p>
          <p className="text-gray-400 text-xs mt-1">Add transactions to get AI-powered alerts</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`card transition-all ${
                !a.is_read
                  ? 'border-l-4 ' +
                    (a.severity === 'high'
                      ? 'border-l-red-500'
                      : a.severity === 'medium'
                      ? 'border-l-yellow-500'
                      : 'border-l-blue-500')
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{ICONS[a.severity]}</div>
                <div className="flex-1 min-w-0">
                  {/* Title + badges row — wraps on mobile */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{a.title}</h3>
                    <span className={`badge-${a.severity}`}>{a.severity.toUpperCase()}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[a.alert_type] || a.alert_type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-snug">{a.message}</p>
                  <p className="text-gray-400 text-xs mt-1.5">{DATE_FMT(a.created_at)}</p>
                </div>
                {!a.is_read && (
                  <button
                    onClick={() => handleRead(a.id)}
                    className="text-gray-400 hover:text-green-600 transition-colors shrink-0 mt-0.5"
                    title="Mark as read"
                  >
                    <CheckCircle size={17} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
