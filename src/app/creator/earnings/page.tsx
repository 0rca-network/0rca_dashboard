'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, Percent, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Earning {
  id: string
  agent_id: string
  revenue_amount: number
  platform_fee: number
  timestamp: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  details: any
  timestamp: string
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch user's agents first
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('creator_id', user.id)

    if (agents && agents.length > 0) {
      const agentIds = agents.map(a => a.id)

      // Fetch earnings for user's agents
      const { data: earningsData } = await supabase
        .from('earnings')
        .select('*')
        .in('agent_id', agentIds)
        .order('timestamp', { ascending: false })

      setEarnings(earningsData || [])
    }

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10)

    setTransactions(transactionsData || [])
    setLoading(false)
  }

  // Mock data for demonstration
  const mockEarnings = [
    { id: '1', agent_id: 'agent1', revenue_amount: 125.50, platform_fee: 12.55, timestamp: new Date().toISOString() },
    { id: '2', agent_id: 'agent2', revenue_amount: 89.25, platform_fee: 8.93, timestamp: new Date().toISOString() },
    { id: '3', agent_id: 'agent1', revenue_amount: 156.75, platform_fee: 15.68, timestamp: new Date().toISOString() },
  ]

  const mockTransactions = [
    { id: '1', type: 'payout', amount: 245.67, details: { method: 'bank_transfer' }, timestamp: new Date().toISOString() },
    { id: '2', type: 'earning', amount: 89.25, details: { agent_id: 'agent2' }, timestamp: new Date().toISOString() },
    { id: '3', type: 'fee', amount: -12.55, details: { type: 'platform_fee' }, timestamp: new Date().toISOString() },
  ]

  const displayEarnings = earnings.length > 0 ? earnings : mockEarnings
  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions

  const totalRevenue = displayEarnings.reduce((sum, e) => sum + e.revenue_amount, 0)
  const totalFees = displayEarnings.reduce((sum, e) => sum + e.platform_fee, 0)
  const netEarnings = totalRevenue - totalFees

  const revenueBreakdownData = [
    { name: 'Direct Usage', value: totalRevenue * 0.7, color: '#8884d8' },
    { name: 'Composition', value: totalRevenue * 0.3, color: '#82ca9d' },
  ]

  const monthlyEarningsData = [
    { month: 'Jan', earnings: 245.67 },
    { month: 'Feb', earnings: 312.45 },
    { month: 'Mar', earnings: 189.23 },
    { month: 'Apr', earnings: 456.78 },
    { month: 'May', earnings: 523.91 },
    { month: 'Jun', earnings: 678.34 },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
        <p className="text-muted-foreground">Track your revenue and manage payouts</p>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">10% of revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(netEarnings * 0.3).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyEarningsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                    <Bar dataKey="earnings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Direct Usage Earnings</CardTitle>
                <CardDescription>Revenue from direct agent calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(totalRevenue * 0.7).toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">70% of total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Composition Earnings</CardTitle>
                <CardDescription>Revenue from agent compositions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(totalRevenue * 0.3).toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">30% of total revenue</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Earnings by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Net Earnings</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEarnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="font-medium">{earning.agent_id}</TableCell>
                      <TableCell>${earning.revenue_amount.toFixed(2)}</TableCell>
                      <TableCell>${earning.platform_fee.toFixed(2)}</TableCell>
                      <TableCell>${(earning.revenue_amount - earning.platform_fee).toFixed(2)}</TableCell>
                      <TableCell>{new Date(earning.timestamp).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'payout' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'earning' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {transaction.details?.method || transaction.details?.type || 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(transaction.timestamp).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}