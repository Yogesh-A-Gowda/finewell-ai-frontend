import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/users/register', data)
export const login = (data) => api.post('/users/login', data)
export const getMe = () => api.get('/users/me')
export const updateProfile = (data) => api.put('/users/me', data)

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params })
export const addTransaction = (data) => api.post('/transactions', data)
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`)

// Analysis
export const getSummary = () => api.get('/analysis/summary')
export const getHealthScore = () => api.get('/analysis/health')
export const getCashflow = (days = 7) => api.get('/analysis/cashflow', { params: { days } })
export const getSpendingBreakdown = (days = 30) => api.get('/analysis/spending-breakdown', { params: { days } })

// Alerts
export const getAlerts = (unreadOnly = false) => api.get('/alerts', { params: { unread_only: unreadOnly } })
export const markAlertRead = (id) => api.put(`/alerts/${id}/read`)
export const markAllAlertsRead = () => api.put('/alerts/read-all')

// Chat
export const sendChatMessage = (message) => api.post('/chat', { message })

export default api
