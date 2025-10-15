'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, Search, Eye, Filter, DollarSign, Clock, Zap, Bot } from 'lucide-react'

interface Execution {
  id: string
  goal: string
  status: string
  token_cost: number
  total_cost: number
  time_taken_ms: number
  results: any
  decision_hashes: any
  created_at: string
}

export default function HistoryPage() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchExecutions()
  }, [])

  const fetchExecutions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('executions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setExecutions(data)
    }
    setLoading(false)
  }

  // Mock data for demonstration
  const mockExecutions: Execution[] = [
    {
      id: '1',
      goal: 'Analyze quarterly sales data and identify trends',
      status: 'completed',
      token_cost: 1250,
      total_cost: 8.75,
      time_taken_ms: 3200,
      results: {
        summary: 'Analysis completed successfully',
        agents_used: ['Data Analyzer', 'Trend Detector', 'Report Generator'],
        output: 'Quarterly sales show 15% growth with strong performance in Q3.'
      },
      decision_hashes: { agent_selection: 'hash123' },
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      goal: 'Generate marketing content for product launch',
      status: 'completed',
      token_cost: 890,
      total_cost: 6.23,
      time_taken_ms: 2800,
      results: {
        summary: 'Content generated successfully',
        agents_used: ['Content Creator', 'SEO Optimizer'],
        output: 'Created comprehensive marketing campaign with 5 content pieces.'
      },
      decision_hashes: { agent_selection: 'hash456' },
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      goal: 'Summarize research papers on AI in healthcare',
      status: 'failed',
      token_cost: 450,
      total_cost: 3.15,
      time_taken_ms: 1500,
      results: {
        summary: 'Execution failed due to timeout',
        agents_used: ['Research Analyzer'],
        error: 'Agent timeout after 30 seconds'
      },
      decision_hashes: { agent_selection: 'hash789' },
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  const displayExecutions = executions.length > 0 ? executions : mockExecutions

  const filteredExecutions = displayExecutions.filter(execution => {
    const matchesSearch = execution.goal.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalSpent = displayExecutions.reduce((sum, e) => sum + e.total_cost, 0)
  const totalTokens = displayExecutions.reduce((sum, e) => sum + e.token_cost, 0)
  const avgExecutionTime = displayExecutions.reduce((sum, e) => sum + e.time_taken_ms, 0) / displayExecutions.length / 1000

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Execution History</h1>
        <p className="text-muted-foreground">View and analyze your past agent executions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayExecutions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExecutionTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Per execution</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Execution List</TabsTrigger>
          <TabsTrigger value="details">Execution Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Your Executions
              </CardTitle>
              <CardDescription>Browse and filter your execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search executions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                </select>
              </div>

              {/* Executions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExecutions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={execution.goal}>
                          {execution.goal}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={execution.status === 'completed' ? 'default' : 
                                      execution.status === 'failed' ? 'destructive' : 'secondary'}>
                          {execution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${execution.total_cost.toFixed(2)}</TableCell>
                      <TableCell>{execution.token_cost.toLocaleString()}</TableCell>
                      <TableCell>{(execution.time_taken_ms / 1000).toFixed(1)}s</TableCell>
                      <TableCell>{new Date(execution.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredExecutions.length === 0 && (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No executions found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {selectedExecution ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Details</CardTitle>
                  <CardDescription>ID: {selectedExecution.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Goal</h3>
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedExecution.goal}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-medium text-sm">Status</h4>
                        <Badge variant={selectedExecution.status === 'completed' ? 'default' : 
                                      selectedExecution.status === 'failed' ? 'destructive' : 'secondary'}>
                          {selectedExecution.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Total Cost</h4>
                        <p>${selectedExecution.total_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Tokens Used</h4>
                        <p>{selectedExecution.token_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Duration</h4>
                        <p>{(selectedExecution.time_taken_ms / 1000).toFixed(1)}s</p>
                      </div>
                    </div>

                    {selectedExecution.results && (
                      <div>
                        <h3 className="font-medium mb-2">Results</h3>
                        <div className="space-y-2">
                          <p className="text-sm bg-muted p-3 rounded-lg">
                            {selectedExecution.results.output || selectedExecution.results.summary}
                          </p>
                          {selectedExecution.results.error && (
                            <p className="text-sm bg-red-50 text-red-800 p-3 rounded-lg">
                              Error: {selectedExecution.results.error}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Breakdown Widget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-4 w-4" />
                    Agent Breakdown
                  </CardTitle>
                  <CardDescription>Visual breakdown of agents used in this execution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedExecution.results?.agents_used?.map((agent: string, index: number) => {
                      const mockMetrics = {
                        tokens: Math.floor(selectedExecution.token_cost / selectedExecution.results.agents_used.length),
                        cost: (selectedExecution.total_cost / selectedExecution.results.agents_used.length).toFixed(2),
                        time: (selectedExecution.time_taken_ms / selectedExecution.results.agents_used.length / 1000).toFixed(1),
                        quality: Math.floor(Math.random() * 20) + 80
                      }

                      return (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Bot className="h-8 w-8 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{agent}</h4>
                              <p className="text-sm text-muted-foreground">Agent #{index + 1}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-medium">{mockMetrics.tokens}</p>
                              <p className="text-muted-foreground">Tokens</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">${mockMetrics.cost}</p>
                              <p className="text-muted-foreground">Cost</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{mockMetrics.time}s</p>
                              <p className="text-muted-foreground">Time</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{mockMetrics.quality}%</p>
                              <p className="text-muted-foreground">Quality</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an execution from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}