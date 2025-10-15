'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Bot, Star, DollarSign, Zap, Clock, Filter } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  category: string
  pricing_type: string
  price_details: any
  status: string
  creator_id: string
}

export default function AgentDiscoveryPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAgents(data)
    }
    setLoading(false)
  }

  // Mock agents for demonstration
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'NLP Text Analyzer',
      description: 'Advanced natural language processing for sentiment analysis, entity extraction, and text classification.',
      category: 'NLP',
      pricing_type: 'per_token',
      price_details: { per_token: 0.001 },
      status: 'active',
      creator_id: 'creator1'
    },
    {
      id: '2',
      name: 'Image Recognition Pro',
      description: 'State-of-the-art computer vision for object detection, image classification, and scene analysis.',
      category: 'Vision',
      pricing_type: 'per_request',
      price_details: { per_request: 0.05 },
      status: 'active',
      creator_id: 'creator2'
    },
    {
      id: '3',
      name: 'Data Insights Engine',
      description: 'Powerful analytics engine for data processing, trend analysis, and predictive modeling.',
      category: 'Analytics',
      pricing_type: 'per_token',
      price_details: { per_token: 0.002 },
      status: 'active',
      creator_id: 'creator3'
    },
    {
      id: '4',
      name: 'Code Assistant',
      description: 'AI-powered coding assistant for code generation, debugging, and optimization across multiple languages.',
      category: 'Development',
      pricing_type: 'per_token',
      price_details: { per_token: 0.0015 },
      status: 'active',
      creator_id: 'creator4'
    },
    {
      id: '5',
      name: 'Content Generator',
      description: 'Creative AI for generating marketing content, blog posts, and social media content.',
      category: 'Content',
      pricing_type: 'per_request',
      price_details: { per_request: 0.10 },
      status: 'active',
      creator_id: 'creator5'
    },
    {
      id: '6',
      name: 'Financial Analyzer',
      description: 'Specialized AI for financial data analysis, risk assessment, and market predictions.',
      category: 'Finance',
      pricing_type: 'per_token',
      price_details: { per_token: 0.003 },
      status: 'active',
      creator_id: 'creator6'
    }
  ]

  const displayAgents = agents.length > 0 ? agents : mockAgents

  const filteredAgents = displayAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || agent.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'low' && (agent.price_details.per_token || agent.price_details.per_request) <= 0.001) ||
                        (priceFilter === 'medium' && (agent.price_details.per_token || agent.price_details.per_request) > 0.001 && (agent.price_details.per_token || agent.price_details.per_request) <= 0.01) ||
                        (priceFilter === 'high' && (agent.price_details.per_token || agent.price_details.per_request) > 0.01)
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  const categories = ['all', ...Array.from(new Set(displayAgents.map(a => a.category)))]

  const getMockRating = () => (Math.random() * 2 + 3).toFixed(1) // 3.0 - 5.0
  const getMockSpeed = () => Math.floor(Math.random() * 3000) + 500 // 500-3500ms

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Discovery</h1>
        <p className="text-muted-foreground">Browse and discover AI agents for your tasks</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-4 w-4" />
            Find Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Prices</option>
                <option value="low">Low (≤$0.001)</option>
                <option value="medium">Medium ($0.001-$0.01)</option>
                <option value="high">High (>$0.01)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => {
          const rating = getMockRating()
          const speed = getMockSpeed()
          const price = agent.price_details.per_token || agent.price_details.per_request || 0

          return (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge variant="secondary">{agent.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{rating}</span>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {agent.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="font-medium">${price.toFixed(4)}</p>
                      <p className="text-muted-foreground text-xs">
                        per {agent.pricing_type.replace('per_', '')}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="font-medium">{speed}ms</p>
                      <p className="text-muted-foreground text-xs">avg speed</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="font-medium">{Math.floor(Math.random() * 50) + 50}</p>
                      <p className="text-muted-foreground text-xs">requests/min</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm">
                      Use Agent
                    </Button>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAgents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No agents found matching your criteria</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setPriceFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Featured Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Categories</CardTitle>
          <CardDescription>Explore agents by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'NLP', count: 12, icon: '🔤', description: 'Text processing and analysis' },
              { name: 'Vision', count: 8, icon: '👁️', description: 'Image and video analysis' },
              { name: 'Analytics', count: 15, icon: '📊', description: 'Data insights and predictions' },
              { name: 'Development', count: 6, icon: '💻', description: 'Code generation and debugging' },
              { name: 'Content', count: 9, icon: '✍️', description: 'Creative content generation' },
              { name: 'Finance', count: 4, icon: '💰', description: 'Financial analysis and modeling' },
            ].map((category) => (
              <div 
                key={category.name}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setCategoryFilter(category.name)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-blue-600">{category.count} agents available</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}