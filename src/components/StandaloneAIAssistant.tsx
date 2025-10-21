'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Mic, MicOff, Volume2, VolumeX, Send, Code, Plus, X, MessageSquare, ChevronLeft, ChevronRight, Search, Settings, User, CreditCard, LogOut, Edit, Bot } from 'lucide-react'
import { Switch } from './ui/switch'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  created_at: Date
}

interface StandaloneAIAssistantProps {
  onDeveloperMode?: () => void
  showDeveloperButton?: boolean
  globeImageUrl?: string
  title?: string
  subtitle?: string
  userId?: string
}

export function StandaloneAIAssistant({
  onDeveloperMode,
  showDeveloperButton = true,
  globeImageUrl,
  title = "Orca Network AI",
  subtitle = "Your intelligent agent network companion",
  userId
}: StandaloneAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [userName, setUserName] = useState('User')
  const [isEditingName, setIsEditingName] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [authProvider, setAuthProvider] = useState('')
  const [showSettingsPopup, setShowSettingsPopup] = useState(false)
  const [autoAIAgent, setAutoAIAgent] = useState(false)
  const settingsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognitionInstance.onerror = () => setIsListening(false)
      recognitionInstance.onend = () => setIsListening(false)

      setRecognition(recognitionInstance)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadChatHistoryFromDB()
      loadUserData()
    }
  }, [userId])

  const loadChatHistoryFromDB = async () => {
    if (!userId) return
    
    try {
      // Load chat sessions from database
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      if (sessions && sessions.length > 0) {
        // Load messages for each session
        const sessionsWithMessages = await Promise.all(
          sessions.map(async (session) => {
            const { data: messages, error: messagesError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true })

            if (messagesError) throw messagesError

            return {
              id: session.id,
              title: session.title,
              created_at: new Date(session.created_at),
              messages: messages?.map(msg => ({
                id: msg.id,
                text: msg.content,
                isUser: msg.is_user,
                timestamp: new Date(msg.created_at)
              })) || []
            }
          })
        )

        setChatSessions(sessionsWithMessages)
        if (sessionsWithMessages.length > 0) {
          setCurrentSessionId(sessionsWithMessages[0].id)
          setMessages(sessionsWithMessages[0].messages)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Fallback to localStorage if database fails
      loadChatHistoryFromLocalStorage()
    }
    
    const storedName = localStorage.getItem(`user_name_${userId}`)
    if (storedName) {
      setUserName(storedName)
    }
  }

  const loadChatHistoryFromLocalStorage = () => {
    if (!userId) return
    
    const stored = localStorage.getItem(`chat_sessions_${userId}`)
    if (stored) {
      const sessions = JSON.parse(stored).map((s: any) => ({
        ...s,
        created_at: new Date(s.created_at),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }))
      setChatSessions(sessions)
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id)
        setMessages(sessions[0].messages)
      }
    }
  }

  const loadUserData = async () => {
    if (!userId) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
      
      // Determine auth provider
      if (user.app_metadata?.provider) {
        setAuthProvider(user.app_metadata.provider)
      } else if (user.user_metadata?.provider) {
        setAuthProvider(user.user_metadata.provider)
      } else {
        setAuthProvider('email')
      }
      
      // Set display name from provider data
      if (user.user_metadata?.full_name && !localStorage.getItem(`user_name_${userId}`)) {
        setUserName(user.user_metadata.full_name)
      } else if (user.user_metadata?.name && !localStorage.getItem(`user_name_${userId}`)) {
        setUserName(user.user_metadata.name)
      }
    }
  }

  const filteredSessions = chatSessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const saveUserName = (name: string) => {
    if (!userId) return
    localStorage.setItem(`user_name_${userId}`, name)
    setUserName(name)
  }

  const handleSettingsHover = () => {
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current)
    }
    setShowSettingsPopup(true)
  }

  const handleSettingsLeave = () => {
    settingsTimeoutRef.current = setTimeout(() => {
      setShowSettingsPopup(false)
    }, 100)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      // Clear local storage
      if (userId) {
        localStorage.removeItem(`chat_sessions_${userId}`)
        localStorage.removeItem(`user_name_${userId}`)
      }
      // Clear all cache and redirect to login
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/auth/login'
    }
  }

  const saveChatHistoryToDB = async (session: ChatSession) => {
    if (!userId) return
    
    try {
      // Save or update session
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: userId,
          title: session.title,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Delete existing messages for this session
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', session.id)

      // Save new messages
      if (session.messages.length > 0) {
        const messagesToInsert = session.messages.map(msg => ({
          session_id: session.id,
          content: msg.text,
          is_user: msg.isUser,
          created_at: msg.timestamp.toISOString()
        }))

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .insert(messagesToInsert)

        if (messagesError) throw messagesError
      }
    } catch (error) {
      console.error('Error saving chat history to DB:', error)
      // Fallback to localStorage
      saveChatHistoryToLocalStorage([session])
    }
  }

  const saveChatHistoryToLocalStorage = (sessions: ChatSession[]) => {
    if (!userId) return
    localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(sessions))
  }

  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      created_at: new Date()
    }
    
    // Save to database first
    await saveChatHistoryToDB(newSession)
    
    // Then update local state
    const updatedSessions = [newSession, ...chatSessions]
    setChatSessions(updatedSessions)
    setCurrentSessionId(newSession.id)
    setMessages([])
  }

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
    }
  }

  const updateCurrentSession = async (newMessages: Message[]) => {
    if (!currentSessionId) return
    
    const updatedSessions = chatSessions.map(session => {
      if (session.id === currentSessionId) {
        const title = newMessages.length > 0 && newMessages.find(m => m.isUser) ? 
          newMessages.find(m => m.isUser)!.text.substring(0, 30) + (newMessages.find(m => m.isUser)!.text.length > 30 ? '...' : '') : 
          'New Chat'
        return { ...session, messages: newMessages, title }
      }
      return session
    })
    setChatSessions(updatedSessions)
    
    const currentSession = updatedSessions.find(s => s.id === currentSessionId)
    if (currentSession) {
      await saveChatHistoryToDB(currentSession)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      // Update local state
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId)
      setChatSessions(updatedSessions)
      
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id)
          setMessages(updatedSessions[0].messages)
        } else {
          setCurrentSessionId(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim()
    
    // Greetings
    if (lowerMessage === 'hello' || lowerMessage === 'hi' || lowerMessage === 'hey' || lowerMessage.startsWith('hello') || lowerMessage.startsWith('hi ') || lowerMessage.startsWith('hey ')) {
      return "Hi there! 👋 I'm your Orca Network AI assistant. I can help you with agent creation, orchestrator usage, wallet management, earnings tracking, and all platform features. What would you like to explore?"
    }
    
    // Platform Overview
    if (lowerMessage.includes('what is orca') || lowerMessage.includes('about orca') || lowerMessage.includes('orca network')) {
      return "Orca Network is a comprehensive AI agent marketplace built with Next.js 14, TypeScript, and Supabase. It's a full-stack platform where creators can deploy and monetize AI agents, while users can discover and execute complex tasks using agent compositions. The platform features role-based dashboards, real-time analytics, wallet management, and a sophisticated orchestration system."
    }
    
    // User Roles
    if (lowerMessage.includes('role') || lowerMessage.includes('creator') || lowerMessage.includes('user')) {
      return "Orca Network has two main user roles: 1) **Creators** - Deploy and manage AI agents, track performance analytics, monitor earnings and payouts, configure pricing and API endpoints. 2) **Users** - Execute tasks via the Orchestrator Console, manage wallet and budgets, discover agents in the marketplace, view execution history with detailed breakdowns. You can switch roles anytime in Settings."
    }
    
    // Agent Creation & Management
    if (lowerMessage.includes('create agent') || lowerMessage.includes('deploy agent') || lowerMessage.includes('my agents')) {
      return "To create an agent: 1) Switch to Creator role in Settings, 2) Go to 'My Agents' section, 3) Click 'Create Agent', 4) Configure: name, description, category, pricing (per-token/per-request), API endpoint, max concurrent requests. Your agent will be available in the marketplace. You can monitor performance with metrics like success rate, response time, revenue, and efficiency rankings."
    }
    
    // Orchestrator Console
    if (lowerMessage.includes('orchestrator') || lowerMessage.includes('execute') || lowerMessage.includes('task')) {
      return "The Orchestrator Console is where users execute complex tasks: 1) Enter your goal/query in the text area, 2) Set max budget with the slider, 3) Click 'Run' to start execution. The system automatically selects optimal agents, shows real-time progress, and provides detailed results including token usage, costs, execution time, and agent breakdown. All executions are saved in your history."
    }
    
    // Wallet & Billing
    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance') || lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
      return "Wallet Management features: 1) **Balance** - Add funds via credit card, view current balance, 2) **Budget Control** - Set monthly spending limits, get alerts at 80% usage, 3) **Analytics** - Track spending trends, category breakdowns, cost efficiency, 4) **Transactions** - Complete history of top-ups and executions. New users start with $100 balance."
    }
    
    // Earnings & Revenue
    if (lowerMessage.includes('earnings') || lowerMessage.includes('revenue') || lowerMessage.includes('payout') || lowerMessage.includes('money')) {
      return "Creator Earnings System: 1) **Revenue Sources** - Direct agent usage (70%) and composition usage (30%), 2) **Platform Fee** - 10% deducted from all earnings, 3) **Analytics** - Monthly trends, revenue breakdown, efficiency metrics, 4) **Payouts** - Track pending amounts, transaction history, bank transfer options. Revenue is calculated based on token usage and your pricing model."
    }
    
    // Agent Discovery
    if (lowerMessage.includes('discover') || lowerMessage.includes('marketplace') || lowerMessage.includes('find agent')) {
      return "Agent Discovery features: 1) **Browse** - Grid view of all available agents with ratings and metrics, 2) **Filters** - By category (NLP, Vision, Analytics, Development, Content, Finance), price range, speed, rating, 3) **Details** - Each agent shows pricing, average response time, success rate, and creator info, 4) **Categories** - Organized by functionality with agent counts and descriptions."
    }
    
    // Execution History
    if (lowerMessage.includes('history') || lowerMessage.includes('past') || lowerMessage.includes('previous')) {
      return "Execution History provides: 1) **Complete Log** - All past executions with filtering by status, date, cost, 2) **Detailed View** - Goal, status, token usage, total cost, duration, results, 3) **Agent Breakdown** - Visual tree showing which agents were used, their individual costs, tokens, time, and quality scores, 4) **Search & Filter** - Find specific executions quickly."
    }
    
    // Analytics & Insights
    if (lowerMessage.includes('analytics') || lowerMessage.includes('insights') || lowerMessage.includes('performance')) {
      return "Analytics Dashboard includes: 1) **Performance Metrics** - Success rate, average response time, total requests, unique users, 2) **Revenue Analytics** - Monthly trends, cost efficiency, revenue sources, 3) **Usage Patterns** - Peak hours, request volume, token consumption, 4) **Agent Performance** - Individual agent metrics, efficiency rankings, optimization suggestions."
    }
    
    // Technical Stack
    if (lowerMessage.includes('technology') || lowerMessage.includes('tech stack') || lowerMessage.includes('built with')) {
      return "Orca Network is built with: **Frontend** - Next.js 14 (App Router), React 18, TypeScript, **Styling** - Tailwind CSS, Shadcn/UI components, **Backend** - Supabase (PostgreSQL, Auth, Realtime), **Charts** - Recharts, **Deployment** - Vercel, **Features** - Row Level Security, React Server Components, real-time updates, responsive design, dark mode support."
    }
    
    // Database & Security
    if (lowerMessage.includes('database') || lowerMessage.includes('security') || lowerMessage.includes('data')) {
      return "Database & Security: 1) **Tables** - profiles, agents, executions, earnings, transactions with proper relationships, 2) **Security** - Row Level Security (RLS) policies, user authentication via Supabase Auth, 3) **Data Protection** - Users can only access their own data, creators manage their agents, secure API endpoints, 4) **Backup** - Automatic Supabase backups and point-in-time recovery."
    }
    
    // Settings & Configuration
    if (lowerMessage.includes('settings') || lowerMessage.includes('profile') || lowerMessage.includes('account')) {
      return "Settings & Account Management: 1) **Profile** - Update email, switch between Creator/User roles, 2) **Notifications** - Configure alerts for executions, budget limits, new agents, weekly summaries, 3) **Wallet** - Connect payment methods, manage billing, 4) **Security** - 2FA, password changes, API keys, session management, 5) **Theme** - Dark/light mode toggle."
    }
    
    // Notifications
    if (lowerMessage.includes('notification') || lowerMessage.includes('alert')) {
      return "Notification System: 1) **Types** - Execution completions, budget alerts, new agent releases, weekly summaries, 2) **Delivery** - In-app toasts, email notifications (configurable), 3) **Management** - Mark as read, dismiss, notification preferences in Settings, 4) **Categories** - Success (green), warnings (yellow), errors (red), info (blue) with appropriate icons and actions."
    }
    
    // Pricing & Business Model
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return "Pricing Model: 1) **For Users** - Pay per token usage, set monthly budgets, transparent cost breakdown, 2) **For Creators** - Set your own pricing (per-token or per-request), keep 90% of revenue, 3) **Platform Fee** - 10% on all transactions, 4) **Free Tier** - $100 starting balance for new users, 5) **Payment** - Credit card, future crypto wallet integration planned."
    }
    
    // Getting Started
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('first time')) {
      return "Getting Started Guide: 1) **Sign Up** - Create account with email verification, 2) **Choose Role** - User (consume agents) or Creator (build agents), 3) **For Users** - Explore Agent Discovery, try Orchestrator with sample tasks, manage wallet, 4) **For Creators** - Create your first agent, set pricing, monitor performance, 5) **Navigation** - Use sidebar to access all features, switch roles anytime in Settings."
    }
    
    // Troubleshooting
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error') || lowerMessage.includes('help')) {
      return "Common Solutions: 1) **Login Issues** - Check email verification, reset password if needed, 2) **Agent Creation** - Ensure valid API endpoint, proper pricing format, 3) **Execution Failures** - Check wallet balance, verify agent availability, 4) **Performance** - Clear browser cache, check internet connection, 5) **Support** - Use Developer Dashboard for detailed logs and system status."
    }
    
    // Features & Capabilities
    if (lowerMessage.includes('feature') || lowerMessage.includes('capability') || lowerMessage.includes('can do')) {
      return "Key Features: 1) **Agent Marketplace** - Discover, deploy, and monetize AI agents, 2) **Orchestration** - Complex task execution with budget control, 3) **Real-time Analytics** - Performance tracking and insights, 4) **Wallet Management** - Balance, budgets, spending analytics, 5) **Role-based Dashboards** - Tailored experiences for creators and users, 6) **Chat History** - Persistent conversations with this AI assistant, 7) **Dark Mode** - Theme switching support."
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm here to help with any Orca Network questions. Feel free to ask about agents, orchestrator, wallet, earnings, or any other platform features! 🚀"
    }
    
    // Goodbye responses
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
      return "Goodbye! Thanks for using Orca Network. Come back anytime if you need help with the platform! 👋"
    }
    
    // Default response for unmatched queries
    return `I understand you're asking about "${userMessage}". As your Orca Network AI assistant, I can help with: • Agent creation & management • Orchestrator usage • Wallet & billing • Earnings tracking • Marketplace discovery • Analytics • Settings • Troubleshooting. Could you be more specific about what you'd like to know?`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    let sessionId = currentSessionId
    if (!sessionId) {
      await createNewSession()
      sessionId = chatSessions[0]?.id || currentSessionId
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    setTimeout(async () => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        text: generateAIResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      }
      const finalMessages = [...newMessages, aiResponse]
      setMessages(finalMessages)
      await updateCurrentSession(finalMessages)
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiResponse.text)
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        speechSynthesis.speak(utterance)
      }
    }, 1000)

    setInputValue('')
  }

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const toggleSpeaking = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        speechSynthesis.cancel()
        setIsSpeaking(false)
      }
    }
  }

  return (
    <>
      {/* Settings Popup Portal */}
      {showSettingsPopup && (
        <div className={`fixed ${isCollapsed ? 'left-20 bottom-16' : 'left-80 bottom-16'} w-80 z-[99999]`}>
          <div 
            className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg shadow-2xl"
            onMouseEnter={handleSettingsHover}
            onMouseLeave={handleSettingsLeave}
          >
            <div className="p-4">
              <h3 className="text-white font-semibold mb-4">User Settings</h3>
              
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white text-sm h-8"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveUserName(userName)
                              setIsEditingName(false)
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            saveUserName(userName)
                            setIsEditingName(false)
                          }}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 h-8 px-2"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium text-sm">{userName}</p>
                        <Button
                          onClick={() => setIsEditingName(true)}
                          size="sm"
                          variant="ghost"
                          className="text-white/70 hover:text-white hover:bg-white/20 p-1 h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-white/70 text-xs">Free Plan • {authProvider === 'email' ? 'Email' : authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Button
                  onClick={() => {
                    setShowSettingsPopup(false)
                    alert(`Email: ${userEmail}\nProvider: ${authProvider === 'email' ? 'Email/Password' : authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}`)
                  }}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/20 h-8 text-sm"
                >
                  <User className="h-3 w-3 mr-2" />
                  User Details
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/20 h-8 text-sm"
                >
                  <CreditCard className="h-3 w-3 mr-2" />
                  Plan Upgrade
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-500/20 h-8 text-sm"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-800 flex">
      
      {/* Chat History Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} backdrop-blur-lg bg-white/10 border-r border-white/20 shadow-2xl transition-all duration-300 relative`}>
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {!isCollapsed && <h3 className="text-white font-semibold">Chat History</h3>}
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Collapsed View */}
            {isCollapsed ? (
              <div className="flex flex-col h-full">
                <div className="space-y-4">
                  <Button
                    onClick={createNewSession}
                    size="sm"
                    variant="ghost"
                    className="w-full text-white hover:bg-cyan-600/50"
                    title="New Chat"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1"></div>
                <div className="space-y-2">
                  <Button
                    onMouseEnter={handleSettingsHover}
                    onMouseLeave={handleSettingsLeave}
                    size="sm"
                    variant="ghost"
                    className="w-full text-white hover:bg-white/20"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {showDeveloperButton && onDeveloperMode && (
                    <Button
                      onClick={onDeveloperMode}
                      size="sm"
                      variant="ghost"
                      className="w-full text-white hover:bg-blue-600/50"
                      title="Developer Dashboard"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>
                </div>

                {/* New Chat Button */}
                <Button
                  onClick={createNewSession}
                  className="w-full mb-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Chat
                </Button>

                {/* Chat Sessions */}
                <div className="space-y-2 flex-1 overflow-y-auto mb-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                        currentSessionId === session.id 
                          ? 'bg-cyan-600/50' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <p className="text-white text-sm font-medium truncate pr-6">{session.title}</p>
                      <p className="text-white/70 text-xs">{session.created_at.toLocaleDateString()}</p>
                      <Button
                        onClick={(e) => deleteSession(session.id, e)}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Bottom Buttons */}
                <div className="space-y-2">
                  <Button
                    onMouseEnter={handleSettingsHover}
                    onMouseLeave={handleSettingsLeave}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  {showDeveloperButton && onDeveloperMode && (
                    <Button
                      onClick={onDeveloperMode}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Developer Dashboard
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 backdrop-blur-lg bg-white/10 border-r border-white/20 shadow-2xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">Settings</h3>
              <Button
                onClick={() => setShowSettings(false)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Profile */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveUserName(userName)
                            setIsEditingName(false)
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          saveUserName(userName)
                          setIsEditingName(false)
                        }}
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{userName}</p>
                      <Button
                        onClick={() => setIsEditingName(true)}
                        size="sm"
                        variant="ghost"
                        className="text-white/70 hover:text-white hover:bg-white/20 p-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <p className="text-white/70 text-xs">Free Plan</p>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/20"
              >
                <User className="h-4 w-4 mr-3" />
                User Details
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/20"
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Plan Upgrade
              </Button>
              {showDeveloperButton && onDeveloperMode && (
                <Button
                  onClick={onDeveloperMode}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-blue-600/20"
                >
                  <Code className="h-4 w-4 mr-3" />
                  Developer Dashboard
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Main Chat Interface */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {globeImageUrl && (
              <div className="mb-6">
                <img src={globeImageUrl} alt="Globe" className="w-32 h-32 mx-auto" />
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl text-cyan-200 mb-8">{subtitle}</p>
          </div>

          {/* Chat Interface */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
            <div className="p-6">
              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-white/70 py-8">
                    <p>Welcome! Ask me anything about Orca Network.</p>
                    <p className="text-sm mt-2">Try: "How do I create an agent?" or "What is the Orchestrator?"</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isUser
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Automatic AI Agent Toggle */}
              <div className="mb-3 flex justify-start">
                <div className="bg-white/10 border border-white/20 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-3 w-3 text-cyan-400" />
                    <span className="text-white text-xs font-medium">Auto AI</span>
                    <Switch
                      checked={autoAIAgent}
                      onCheckedChange={setAutoAIAgent}
                      className="data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-white/20 scale-75"
                    />
                  </div>
                  {autoAIAgent && (
                    <div className="mt-1 text-cyan-200 text-xs">
                      Auto mode on
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about Orca Network..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                
                {recognition && (
                  <Button
                    onClick={toggleListening}
                    variant="outline"
                    size="icon"
                    className={`bg-white/10 border-white/20 text-white hover:bg-white/20 ${
                      isListening ? 'bg-red-500/50' : ''
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                
                <Button
                  onClick={toggleSpeaking}
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={!isSpeaking}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>


    </div>
    </>
  )
}