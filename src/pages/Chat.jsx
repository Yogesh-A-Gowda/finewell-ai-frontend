import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Send, Bot, User, Sparkles } from 'lucide-react'

const STARTERS = [
  'How to avoid minimum balance penalties?',
  'What is my penalty risk this month?',
  'How to save on banking fees in India?',
  'What is UPI AutoPay?',
  'How should a gig worker manage cash flow?',
  'What are Jan Dhan account benefits?',
]

function Message({ msg, onSuggestion }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[82%] md:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
        isBot ? 'bg-white border border-gray-100 text-gray-800 shadow-sm' : 'bg-blue-600 text-white'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
        {isBot && msg.suggestions?.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1">
            <p className="text-xs text-gray-400 font-medium">You might ask:</p>
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => onSuggestion?.(s)}
                className="block text-left text-xs text-blue-600 hover:text-blue-800 hover:underline w-full">
                → {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {!isBot && (
        <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-1">
          <User size={14} className="text-gray-600" />
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
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm FinWell AI.\n\nI can help you avoid penalties, manage cash flow, and understand Indian banking rules.\n\nWhat's on your mind?`,
      suggestions: STARTERS.slice(0, 3),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await sendChatMessage(text.trim())
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: data.response, suggestions: data.suggestions },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: 'Sorry, I could not connect right now. Check that your Gemini API key is set in the backend .env file.' },
      ])
    } finally {
      setLoading(false)
      // Re-focus input on mobile after response
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    /* Use dvh (dynamic viewport height) so mobile browsers handle address bar correctly */
    <div className="flex flex-col h-[calc(100dvh-57px)] lg:h-screen">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm md:text-base">FinWell AI Advisor</h2>
          <p className="text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Gemini 2.0 Flash
          </p>
        </div>
      </div>

      {/* Quick starters — only show before any user message */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
            <Sparkles size={11} /> Quick questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STARTERS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} onSuggestion={(s) => setInput(s)} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
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
      <div className="bg-white border-t border-gray-100 px-3 py-3 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2">
          <input
            ref={inputRef}
            className="input flex-1 text-sm"
            placeholder="Ask about penalties, savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary px-3.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          AI advice is informational only.
        </p>
      </div>
    </div>
  )
}
