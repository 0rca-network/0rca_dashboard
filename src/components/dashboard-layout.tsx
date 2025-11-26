'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { GuidedTour } from '@/components/GuidedTour'
import { 
  Home, 
  Bot, 
  DollarSign, 
  Settings, 
  LogOut, 

  Play,
  History,
  Wallet,
  Search,
  BarChart3,
  Bell,
  Vote,
  Coins,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  role: 'creator' | 'user'
  wallet_balance: number
  monthly_budget: number | null
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [profile, setProfile] = useState<Profile | null>(null)

  const [showTour, setShowTour] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        // Create profile if doesn't exist
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            role: 'user',
            wallet_balance: 100.0
          })
          .select()
          .single()
        
        setProfile(newProfile)
        setIsNewUser(true)
      } else {
        setProfile(profileData)
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem(`tour_completed_${user.id}`)
        if (!hasSeenTour) {
          setIsNewUser(true)
        }
      }
    }

    getProfile()
  }, [router, supabase])

  // Start tour for new users after profile loads
  useEffect(() => {
    if (isNewUser && profile && pathname === '/dashboard') {
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 1000) // Small delay to let the page load
      
      return () => clearTimeout(timer)
    }
  }, [isNewUser, profile, pathname])

  const handleTourComplete = () => {
    setShowTour(false)
    setIsNewUser(false)
    if (profile) {
      localStorage.setItem(`tour_completed_${profile.id}`, 'true')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }



  const creatorNavItems: Array<{href: string; icon: any; label: string; tourId?: string; external?: boolean}> = [
    { href: '/dashboard', icon: Home, label: 'Overview' },
    { href: '/creator/agents', icon: Bot, label: 'My Agents', tourId: 'my-agents' },
    { href: '/creator/earnings', icon: DollarSign, label: 'Earnings', tourId: 'earnings' },
    { href: '/creator/analytics', icon: BarChart3, label: 'Analytics', tourId: 'analytics' },
  ]

  const userNavItems: Array<{href: string; icon: any; label: string; tourId?: string; external?: boolean}> = [
    { href: '/dashboard', icon: Home, label: 'Overview' },
    { href: '/user/orchestrator', icon: Play, label: 'Orchestrator', tourId: 'orchestrator' },
    { href: '/user/history', icon: History, label: 'History', tourId: 'history' },
    { href: '/user/agents', icon: Search, label: 'Discover', tourId: 'discovery' },
    { href: '/user/wallet', icon: Wallet, label: 'Wallet', tourId: 'wallet' },
    { href: 'https://pod.0rca.network', icon: Bot, label: 'Pod', external: true },
  ]

  const daoNavItems = [
    { href: '/dao/governance', icon: Vote, label: 'Governance', tourId: 'governance' },
    { href: '/dao/treasury', icon: Building2, label: 'Treasury', tourId: 'treasury' },
    { href: '/dao/tokens', icon: Coins, label: 'Tokens', tourId: 'tokens' },
  ]

  const commonNavItems = [
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  const navItems = profile?.role === 'creator' ? creatorNavItems : userNavItems

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[#64f2d1]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#22d3ee]/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="flex relative z-10">
        {/* Glassmorphism Sidebar */}
        <aside className="w-64 min-h-screen flex flex-col backdrop-blur-xl bg-surface/30 border-r border-white/10 shadow-2xl">
          {/* Logo Section */}
          <div className="h-28 flex items-center justify-center border-b border-white/10">
            <img src="/orca_text-Photoroom.svg" alt="Orca Network" className="h-24" />
          </div>
          
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{profile.role} Dashboard</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              item.external ? (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </a>
              ) : (
                <Link key={item.href} href={item.href} prefetch={true}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      pathname === item.href
                        ? "bg-[#64f2d1]/20 text-[#64f2d1] border-l-4 border-[#64f2d1] shadow-lg shadow-[#64f2d1]/20"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    data-tour={item.tourId}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              )
            ))}
            
            <div className="pt-4 mt-4 border-t border-white/10">
              <div className="mb-3 px-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">DAO</span>
              </div>
              {daoNavItems.map((item) => (
                <Link key={item.href} href={item.href} prefetch={true}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      pathname === item.href
                        ? "bg-[#64f2d1]/20 text-[#64f2d1] border-l-4 border-[#64f2d1] shadow-lg shadow-[#64f2d1]/20"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    data-tour={item.tourId}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
            
            <div className="pt-4 mt-4 border-t border-white/10">
              {commonNavItems.map((item) => (
                <Link key={item.href} href={item.href} prefetch={true}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      pathname === item.href
                        ? "bg-[#64f2d1]/20 text-[#64f2d1] border-l-4 border-[#64f2d1] shadow-lg shadow-[#64f2d1]/20"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/assistant')}
              className="w-full mb-3 bg-white/5 border-white/10 hover:bg-white/10"
            >
              ← Back to AI Assistant
            </Button>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#64f2d1] to-[#22d3ee] flex items-center justify-center text-[#111827] font-bold">
                {profile.role.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Balance</p>
                <p className="text-xs text-[#64f2d1] font-bold">$0.00</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with Logout */}
          <div className="p-4 border-b border-white/10 backdrop-blur-xl bg-surface/30">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="flex-1 p-6">
            {children}
          </div>
        </div>
      </div>
      
      {/* Guided Tour */}
      {profile && (
        <GuidedTour
          isVisible={showTour}
          onComplete={handleTourComplete}
          userRole={profile.role}
        />
      )}
    </div>
  )
}