'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Home, 
  Bot, 
  DollarSign, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Play,
  History,
  Wallet,
  Search,
  BarChart3,
  Bell
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
  const [darkMode, setDarkMode] = useState(false)
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
      } else {
        setProfile(profileData)
      }
    }

    getProfile()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const creatorNavItems = [
    { href: '/dashboard', icon: Home, label: 'Overview' },
    { href: '/creator/agents', icon: Bot, label: 'My Agents' },
    { href: '/creator/earnings', icon: DollarSign, label: 'Earnings' },
    { href: '/creator/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const userNavItems = [
    { href: '/dashboard', icon: Home, label: 'Overview' },
    { href: '/user/orchestrator', icon: Play, label: 'Orchestrator' },
    { href: '/user/history', icon: History, label: 'History' },
    { href: '/user/agents', icon: Search, label: 'Discover' },
    { href: '/user/wallet', icon: Wallet, label: 'Wallet' },
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
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen p-4 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Orca Network</h1>
            <p className="text-sm text-muted-foreground capitalize">{profile.role} Dashboard</p>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} prefetch={true}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            <div className="pt-4 border-t">
              {commonNavItems.map((item) => (
                <Link key={item.href} href={item.href} prefetch={true}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-auto">
            <Card className="p-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/assistant')}
                className="w-full mb-4"
              >
                ← Back to AI Assistant
              </Button>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Balance</span>
                <span className="font-bold">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dark Mode</span>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with Logout */}
          <div className="p-4 border-b bg-card">
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
    </div>
  )
}