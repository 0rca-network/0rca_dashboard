'use client'

import { useState, useEffect } from 'react'
import { StandaloneAIAssistant } from '@/components/StandaloneAIAssistant'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function AssistantPage() {
  const [user, setUser] = useState<any>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setShowLogin(false)
    }
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (!error) {
      alert('Check your email for verification')
    }
  }

  const handleDeveloperMode = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-800 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">Orca Network AI</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                required
              />
              <div className="space-y-2">
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Sign In
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleSignUp}
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <StandaloneAIAssistant 
      onDeveloperMode={handleDeveloperMode}
      showDeveloperButton={true}
      title="Orca Network AI"
      subtitle="Your intelligent agent network companion"
      userId={user.id}
    />
  )
}