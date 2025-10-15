'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Mic, MicOff, Volume2, VolumeX, Send, Code } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface StandaloneAIAssistantProps {
  onDeveloperMode?: () => void
  showDeveloperButton?: boolean
  globeImageUrl?: string
  title?: string
  subtitle?: string
}

export function StandaloneAIAssistant({
  onDeveloperMode,
  showDeveloperButton = true,
  globeImageUrl,
  title = "Orca Network AI",
  subtitle = "Your intelligent agent network companion"
}: StandaloneAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

      recognitionInstance.onerror = () => {
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('orca') || lowerMessage.includes('network')) {
      return "Orca Network is an AI agent marketplace where creators can deploy agents and users can execute complex tasks. You can create agents, manage earnings, or discover and use existing agents for your needs."
    }
    
    if (lowerMessage.includes('agent') || lowerMessage.includes('create')) {
      return "To create an agent, switch to creator mode in settings, then go to 'My Agents' to configure your AI agent with pricing, API endpoints, and descriptions. Your agent will be available in the marketplace for users to discover."
    }
    
    if (lowerMessage.includes('orchestrator') || lowerMessage.includes('execute')) {
      return "The Orchestrator Console allows you to execute complex tasks using AI agent compositions. Simply describe your goal, set a budget, and let the system select the best agents to complete your task."
    }
    
    if (lowerMessage.includes('wallet') || lowerMessage.includes('balance')) {
      return "Your wallet manages your token balance and spending. You can add funds, set monthly budgets, and track your usage across all agent executions. Check the Wallet section for detailed analytics."
    }
    
    if (lowerMessage.includes('earnings') || lowerMessage.includes('revenue')) {
      return "As a creator, you earn revenue when users execute tasks with your agents. Track your earnings, platform fees, and payout history in the Earnings dashboard. Revenue is calculated based on token usage and your pricing model."
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your Orca Network AI assistant. I can help you understand the platform, create agents, execute tasks, manage your wallet, and navigate the dashboard. What would you like to know?"
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I can help you with: Creating and managing AI agents, using the Orchestrator for task execution, understanding wallet and billing, tracking earnings as a creator, navigating the dashboard, and general platform questions. What specific area interests you?"
    }
    
    return "I understand you're asking about the Orca Network platform. I can help with agents, orchestration, wallets, earnings, and general navigation. Could you be more specific about what you'd like to know?"
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-800 flex items-center justify-center p-4">
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

        {/* Developer Button */}
        {showDeveloperButton && onDeveloperMode && (
          <div className="fixed bottom-6 left-6">
            <Button
              onClick={onDeveloperMode}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              size="sm"
            >
              <Code className="h-4 w-4 mr-2" />
              Developer Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}