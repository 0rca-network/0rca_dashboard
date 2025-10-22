'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'

export default function AnalyticsPage() {
  // Mock analytics data
  const successRateData = [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 94 },
    { month: 'Mar', rate: 89 },
    { month: 'Apr', rate: 96 },
    { month: 'May', rate: 93 },
    { month: 'Jun', rate: 97 },
  ]

  const costEfficiencyData = [
    { month: 'Jan', efficiency: 85, cost: 0.12 },
    { month: 'Feb', efficiency: 88, cost: 0.11 },
    { month: 'Mar', efficiency: 82, cost: 0.13 },
    { month: 'Apr', efficiency: 91, cost: 0.10 },
    { month: 'May', efficiency: 89, cost: 0.11 },
    { month: 'Jun', efficiency: 94, cost: 0.09 },
  ]

  const usagePatternData = [
    { hour: '00', requests: 12 },
    { hour: '04', requests: 8 },
    { hour: '08', requests: 45 },
    { hour: '12', requests: 78 },
    { hour: '16', requests: 92 },
    { hour: '20', requests: 56 },
  ]

  const performanceMetrics = {
    avgSuccessRate: 93.5,
    avgResponseTime: 1.2,
    totalRequests: 15420,
    uniqueUsers: 342
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">Deep dive into your agent performance and usage patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Average across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">Across all requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
            <CardDescription>Monthly success rate of your requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
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
            <CardTitle>Cost Efficiency Trends</CardTitle>
            <CardDescription>Efficiency score and cost per execution over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={costEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stackId="1"
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage Patterns</CardTitle>
            <CardDescription>Request volume by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usagePatternData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Requests']} />
                <Bar dataKey="requests" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Peak Usage Hours</p>
                <p className="text-sm text-muted-foreground">4:00 PM - 6:00 PM</p>
              </div>
              <div className="text-2xl font-bold">92</div>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Best Performing Agent</p>
                <p className="text-sm text-muted-foreground">NLP Analyzer v2</p>
              </div>
              <div className="text-2xl font-bold">97%</div>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Cost Optimization</p>
                <p className="text-sm text-muted-foreground">Potential savings</p>
              </div>
              <div className="text-2xl font-bold text-green-600">$45</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Breakdown</CardTitle>
          <CardDescription>Detailed metrics for each of your agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'NLP Analyzer v2', requests: 5420, successRate: 97, avgTime: 0.8, revenue: 234.56 },
              { name: 'Image Classifier', requests: 3890, successRate: 94, avgTime: 1.2, revenue: 189.23 },
              { name: 'Data Processor', requests: 2340, successRate: 91, avgTime: 1.8, revenue: 145.67 },
              { name: 'Text Summarizer', requests: 3770, successRate: 96, avgTime: 1.1, revenue: 201.34 },
            ].map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{agent.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>{agent.requests.toLocaleString()} requests</span>
                    <span>{agent.successRate}% success</span>
                    <span>{agent.avgTime}s avg time</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${agent.revenue}</div>
                  <div className="text-sm text-muted-foreground">revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}