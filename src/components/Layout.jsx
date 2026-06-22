import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ArrowLeftRight, Bell, MessageCircle, LogOut, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAlerts } from '../services/api'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/chat', label: 'AI Advisor', icon: MessageCircle },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    getAlerts(true).then((r) => setUnread(r.data.length)).catch(() => {})
    const interval = setInterval(() => {
      getAlerts(true).then((r) => setUnread(r.data.length)).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-xl p-2">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">FinWell AI</h1>
              <p className="text-blue-300 text-xs">Financial Wellness</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Alerts' && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-blue-300 hover:text-white text-sm px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
