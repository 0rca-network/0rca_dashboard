'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Bot, Settings, DollarSign, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Agent {
  id: string
  name: string
  description: string
  status: string
  category: string
  pricing_type: string
  price_details: any
  api_endpoint: string
  max_concurrent_requests: number
  created_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    pricing_type: 'per_token',
    price_per_token: 0.001,
    api_endpoint: '',
    max_concurrent_requests: 10
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    } else {
      setAgents(data || [])
    }
    setLoading(false)
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('agents')
      .insert({
        creator_id: user.id,
        name: formData.name,
        description: formData.description,
        status: 'active',
        category: formData.category,
        pricing_type: formData.pricing_type,
        price_details: { per_token: formData.price_per_token },
        api_endpoint: formData.api_endpoint,
        max_concurrent_requests: formData.max_concurrent_requests
      })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Agent created successfully",
      })
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        category: '',
        pricing_type: 'per_token',
        price_per_token: 0.001,
        api_endpoint: '',
        max_concurrent_requests: 10
      })
      fetchAgents()
    }
  }

  const mockPerformanceData = {
    totalRequests: 1250,
    successRate: 94.5,
    avgResponseTime: 1.2,
    revenueEarned: 156.78,
    costPerExecution: 0.125,
    efficiencyRank: 8
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents and monitor their performance</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Agent</CardTitle>
            <CardDescription>Configure your AI agent settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., NLP, Vision, Analytics"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({...formData, api_endpoint: e.target.value})}
                    placeholder="https://api.example.com/agent"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_token">Price per Token ($)</Label>
                  <Input
                    id="price_per_token"
                    type="number"
                    step="0.0001"
                    value={formData.price_per_token}
                    onChange={(e) => setFormData({...formData, price_per_token: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="max_concurrent_requests">Max Concurrent Requests</Label>
                <Input
                  id="max_concurrent_requests"
                  type="number"
                  value={formData.max_concurrent_requests}
                  onChange={(e) => setFormData({...formData, max_concurrent_requests: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Agent</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Agent List</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-4 w-4" />
                Your Agents ({agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No agents created yet</p>
                  <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                    Create Your First Agent
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.category}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {agent.status}
                          </span>
                        </TableCell>
                        <TableCell>${agent.price_details?.per_token || 0}/token</TableCell>
                        <TableCell>{new Date(agent.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockPerformanceData.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockPerformanceData.successRate}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockPerformanceData.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${mockPerformanceData.revenueEarned}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Execution</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${mockPerformanceData.costPerExecution}</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Rank</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{mockPerformanceData.efficiencyRank}</div>
                <p className="text-xs text-muted-foreground">In category</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {selectedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle>Agent Settings: {selectedAgent.name}</CardTitle>
                <CardDescription>Configure your agent parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Agent Name</Label>
                    <Input value={selectedAgent.name} readOnly />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={selectedAgent.description} readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>API Endpoint</Label>
                      <Input value={selectedAgent.api_endpoint} readOnly />
                    </div>
                    <div>
                      <Label>Max Concurrent Requests</Label>
                      <Input value={selectedAgent.max_concurrent_requests} readOnly />
                    </div>
                  </div>
                  <Button>Update Settings</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an agent to configure its settings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}