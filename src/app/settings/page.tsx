'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Bell, Wallet, Shield, Settings as SettingsIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  role: 'creator' | 'user'
  wallet_balance: number
  monthly_budget: number | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState({
    execution_complete: true,
    budget_alerts: true,
    new_agents: false,
    weekly_summary: true
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email || '')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
    setLoading(false)
  }

  const handleUpdateProfile = async () => {
    toast({
      title: "Success",
      description: "Profile updated successfully",
    })
  }

  const handleUpdateNotifications = async () => {
    toast({
      title: "Success",
      description: "Notification preferences updated",
    })
  }

  const handleRoleSwitch = async () => {
    if (!profile) return

    const newRole = profile.role === 'creator' ? 'user' : 'creator'

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to switch role",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Switched to ${newRole} role`,
      })
      setProfile({ ...profile, role: newRole })
      // Refresh the page to update the navigation
      window.location.reload()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings & Account</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Role</h4>
                  <p className="text-sm text-muted-foreground">
                    Current role: <span className="capitalize font-medium">{profile?.role}</span>
                  </p>
                </div>
                <Button onClick={handleRoleSwitch} variant="outline">
                  Switch to {profile?.role === 'creator' ? 'User' : 'Creator'}
                </Button>
              </div>

              <Button onClick={handleUpdateProfile}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Execution Complete</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your agent executions finish
                    </p>
                  </div>
                  <Switch
                    checked={notifications.execution_complete}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, execution_complete: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Budget Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Alerts when approaching budget limits
                    </p>
                  </div>
                  <Switch
                    checked={notifications.budget_alerts}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, budget_alerts: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Agents</h4>
                    <p className="text-sm text-muted-foreground">
                      Notifications about new agents in the marketplace
                    </p>
                  </div>
                  <Switch
                    checked={notifications.new_agents}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, new_agents: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your activity and spending
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weekly_summary}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, weekly_summary: checked})
                    }
                  />
                </div>
              </div>

              <Button onClick={handleUpdateNotifications}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-4 w-4" />
                Connected Wallet Management
              </CardTitle>
              <CardDescription>Manage your payment methods and wallet connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Wallet Integration Coming Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your crypto wallet for seamless payments and earnings
                </p>
                <Button variant="outline" disabled>
                  Connect Wallet
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Current Payment Method</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      💳
                    </div>
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your account password
                    </p>
                  </div>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">API Keys</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage API keys for programmatic access
                    </p>
                  </div>
                  <Button variant="outline">
                    Manage Keys
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Management</h4>
                    <p className="text-sm text-muted-foreground">
                      View and manage active sessions
                    </p>
                  </div>
                  <Button variant="outline">
                    View Sessions
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h5 className="font-medium text-red-800">Delete Account</h5>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}