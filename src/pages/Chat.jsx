import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Send, Bot, User, Sparkles } from 'lucide-react'

const STARTERS = [
  'How can I avoid minimum balance penalties?',
  'What is my penalty risk this month?',
  'How to save money on banking fees in India?',
  'Explain UPI AutoPay benefits',
  'How should a gig worker manage cash flow?',
  'What is Jan Dhan account and its benefits?',
]

function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
        isBot ? 'bg-white border border-gray-100 text-gray-800 shadow-sm' : 'bg-blue-600 text-white'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
        {isBot && msg.suggestions?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium">You might ask:</p>
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => msg.onSuggestion?.(s)}
                className="block text-left text-xs text-blue-600 hover:text-blue-800 hover:underline w-full">
                → {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {!isBot && (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-1">
          <User size={16} className="text-gray-600" />
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'bot',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm FinWell AI, your personal financial wellness advisor.\n\nI can help you:\n• Avoid minimum balance penalties\n• Optimize your cash flow\n• Understand RBI banking rules\n• Build better savings habits\n\nWhat's on your mind?`,
      suggestions: STARTERS.slice(0, 3),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await sendChatMessage(text.trim())
      const addSuggestion = (s) => setInput(s)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: data.response,
          suggestions: data.suggestions,
          onSuggestion: addSuggestion,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'Sorry, I could not connect to the AI service. Please check your Gemini API key in backend .env file.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">FinWell AI Advisor</h2>
          <p className="text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Powered by Gemini 1.5 Flash
          </p>
        </div>
      </div>

      {/* Quick starters */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
            <Sparkles size={12} /> Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={{
              ...msg,
              onSuggestion: (s) => { setInput(s) },
            }}
          />
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Ask about your finances, penalties, savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI advice is informational. Consult a financial advisor for major decisions.
        </p>
      </div>
    </div>
  )
}
