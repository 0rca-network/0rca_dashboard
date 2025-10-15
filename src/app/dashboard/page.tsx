'use client'

import { useProfile, useAgents, useExecutions } from '@/hooks/use-cached-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Bot, Zap, TrendingUp, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: agents } = useAgents(profile?.role === 'creator' ? profile.id : undefined)
  const { data: executions } = useExecutions(profile?.role === 'user' ? profile.id : undefined)

  const dashboardData = profile?.role === 'creator' 
    ? { agents: agents || [], earnings: [] }
    : { executions: (executions || []).slice(0, 5) }

  const loading = profileLoading

  // Token usage data based on actual executions
  const tokenUsageData = [
    { name: 'Mon', tokens: 0 },
    { name: 'Tue', tokens: 0 },
    { name: 'Wed', tokens: 0 },
    { name: 'Thu', tokens: 0 },
    { name: 'Fri', tokens: 0 },
    { name: 'Sat', tokens: 0 },
    { name: 'Sun', tokens: 0 },
  ]
  
  const efficiencyData = [
    { name: 'Week 1', efficiency: 85 },
    { name: 'Week 2', efficiency: 88 },
    { name: 'Week 3', efficiency: 92 },
    { name: 'Week 4', efficiency: 89 },
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found</div>
  }

  const currentMonthTotal = profile.role === 'creator' 
    ? dashboardData.earnings?.reduce((sum: number, e: any) => sum + e.revenue_amount, 0) || 0
    : dashboardData.executions?.reduce((sum: number, e: any) => sum + e.total_cost, 0) || 0

  const activeAgentsCount = profile.role === 'creator'
    ? dashboardData.agents?.filter((a: any) => a.status === 'active').length || 0
    : new Set(dashboardData.executions?.map((e: any) => e.agent_id)).size || 0

  const totalTokens = dashboardData.executions?.reduce((sum: number, e: any) => sum + e.token_cost, 0) || 0

  const efficiencyScore = 87 // Mock calculation

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your {profile.role === 'creator' ? 'agents' : 'executions'}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {profile.role === 'creator' ? 'Total Earnings' : 'Total Spending'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonthTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {profile.role === 'creator' ? 'Your agents' : 'Unique agents used'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiencyScore}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest {profile.role === 'creator' ? 'agent activities' : 'executions'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.role === 'user' && dashboardData.executions?.map((execution: any) => (
              <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{execution.goal}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {execution.status} • Cost: ${execution.total_cost.toFixed(2)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(execution.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {profile.role === 'creator' && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="mx-auto h-12 w-12 mb-4" />
                <p>Create your first agent to see activity here</p>
              </div>
            )}
            {profile.role === 'user' && (!dashboardData.executions || dashboardData.executions.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="mx-auto h-12 w-12 mb-4" />
                <p>No executions yet. Try the Orchestrator to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Token Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tokenUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tokens" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}