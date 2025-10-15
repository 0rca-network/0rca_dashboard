'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wallet, CreditCard, TrendingUp, TrendingDown, Plus, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  wallet_balance: number
  monthly_budget: number | null
}

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile(data)
      setMonthlyBudget(data.monthly_budget?.toString() || '')
    }
    setLoading(false)
  }

  const handleUpdateBudget = async () => {
    if (!profile) return

    const budget = parseFloat(monthlyBudget) || null

    const { error } = await supabase
      .from('profiles')
      .update({ monthly_budget: budget })
      .eq('id', profile.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Monthly budget updated successfully",
      })
      setProfile({ ...profile, monthly_budget: budget })
    }
  }

  const handleTopUp = async () => {
    if (!profile || !topUpAmount) return

    const amount = parseFloat(topUpAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: profile.wallet_balance + amount })
      .eq('id', profile.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add funds",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `$${amount} added to your wallet`,
      })
      setProfile({ ...profile, wallet_balance: profile.wallet_balance + amount })
      setTopUpAmount('')
    }
  }

  // Mock data for charts
  const spendingTrendData = [
    { month: 'Jan', spending: 45.67 },
    { month: 'Feb', spending: 52.34 },
    { month: 'Mar', spending: 38.91 },
    { month: 'Apr', spending: 67.23 },
    { month: 'May', spending: 71.45 },
    { month: 'Jun', spending: 59.82 },
  ]

  const categorySpendingData = [
    { category: 'NLP', amount: 125.45 },
    { category: 'Vision', amount: 89.23 },
    { category: 'Analytics', amount: 156.78 },
    { category: 'Development', amount: 67.34 },
    { category: 'Content', amount: 98.56 },
  ]

  const mockTransactions = [
    { id: '1', type: 'execution', description: 'Data analysis task', amount: -8.75, date: new Date().toISOString() },
    { id: '2', type: 'topup', description: 'Wallet top-up', amount: 50.00, date: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', type: 'execution', description: 'Content generation', amount: -6.23, date: new Date(Date.now() - 172800000).toISOString() },
    { id: '4', type: 'execution', description: 'Image processing', amount: -12.45, date: new Date(Date.now() - 259200000).toISOString() },
    { id: '5', type: 'topup', description: 'Wallet top-up', amount: 25.00, date: new Date(Date.now() - 345600000).toISOString() },
  ]

  const currentMonthSpending = spendingTrendData[spendingTrendData.length - 1]?.spending || 0
  const budgetUsage = profile?.monthly_budget ? (currentMonthSpending / profile.monthly_budget) * 100 : 0

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64">Profile not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet & Cost Management</h1>
        <p className="text-muted-foreground">Manage your balance and track spending</p>
      </div>

      {/* Wallet Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile.wallet_balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${profile.monthly_budget?.toFixed(2) || 'Not set'}
            </div>
            <p className="text-xs text-muted-foreground">Budget limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonthSpending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.monthly_budget ? `${budgetUsage.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Of monthly budget</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topup">Top Up</TabsTrigger>
          <TabsTrigger value="budget">Budget Settings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Trends</CardTitle>
                <CardDescription>Monthly spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={spendingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Spending']} />
                    <Line 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categorySpendingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Budget Alert */}
          {profile.monthly_budget && budgetUsage > 80 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Budget Alert</CardTitle>
                <CardDescription className="text-orange-700">
                  You've used {budgetUsage.toFixed(1)}% of your monthly budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700">
                  Consider reviewing your spending or adjusting your budget limit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="topup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Funds
              </CardTitle>
              <CardDescription>Top up your wallet balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter amount to add"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[10, 25, 50].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setTopUpAmount(amount.toString())}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <Button 
                onClick={handleTopUp}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Add ${topUpAmount || '0'} to Wallet
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>• Funds are added instantly</p>
                <p>• Secure payment processing</p>
                <p>• No additional fees</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Monthly Budget Settings
              </CardTitle>
              <CardDescription>Set spending limits to control costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget">Monthly Budget Limit ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="Enter monthly budget limit"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for no budget limit
                </p>
              </div>

              <Button onClick={handleUpdateBudget}>
                Update Budget
              </Button>

              {profile.monthly_budget && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Budget Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Budget Limit:</span>
                      <span>${profile.monthly_budget.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent This Month:</span>
                      <span>${currentMonthSpending.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span>${(profile.monthly_budget - currentMonthSpending).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <Plus className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}