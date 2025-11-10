'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, DollarSign, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface TreasuryTransaction {
  id: string
  transaction_type: string
  amount: number
  description: string
  status: string
  created_at: string
}

export default function TreasuryPage() {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([])
  const [fundingProposals, setFundingProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalTitle, setProposalTitle] = useState('')
  const [proposalDescription, setProposalDescription] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTreasuryData()
  }, [])

  const fetchTreasuryData = async () => {
    const { data: treasuryData } = await supabase
      .from('dao_treasury')
      .select('*')
      .order('created_at', { ascending: false })

    if (treasuryData) {
      setTransactions(treasuryData)
    }

    // Fetch funding proposals (treasury type proposals)
    const { data: proposalsData } = await supabase
      .from('dao_proposals')
      .select('*')
      .eq('proposal_type', 'treasury')
      .order('created_at', { ascending: false })

    if (proposalsData) {
      setFundingProposals(proposalsData)
    }

    setLoading(false)
  }

  // Mock data for charts
  const treasuryBalance = 2500000
  const monthlyRevenue = 125000
  const monthlyExpenses = 45000

  const revenueData = [
    { month: 'Jan', revenue: 95000, expenses: 35000 },
    { month: 'Feb', revenue: 108000, expenses: 42000 },
    { month: 'Mar', revenue: 115000, expenses: 38000 },
    { month: 'Apr', revenue: 125000, expenses: 45000 },
  ]

  const allocationData = [
    { name: 'Development', value: 40, color: '#3b82f6' },
    { name: 'Marketing', value: 25, color: '#10b981' },
    { name: 'Operations', value: 20, color: '#f59e0b' },
    { name: 'Reserves', value: 15, color: '#8b5cf6' },
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'distribution': return <ArrowDownLeft className="h-4 w-4 text-[#64f2d1]" />
      case 'grant': return <ArrowDownLeft className="h-4 w-4 text-purple-600" />
      case 'expense': return <ArrowDownLeft className="h-4 w-4 text-red-600" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'bg-green-100 text-green-800'
      case 'distribution': return 'bg-[#64f2d1]/20 text-[#64f2d1] border border-[#64f2d1]/30'
      case 'grant': return 'bg-purple-100 text-purple-800'
      case 'expense': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#64f2d1]'
      case 'passed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'executed': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const handleCreateFundingProposal = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim() || !requestedAmount.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(requestedAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a proposal.",
          variant: "destructive",
        })
        return
      }

      const votingEndsAt = new Date()
      votingEndsAt.setDate(votingEndsAt.getDate() + 7)

      const { data, error } = await supabase
        .from('dao_proposals')
        .insert({
          creator_id: user.id,
          title: proposalTitle.trim(),
          description: proposalDescription.trim(),
          proposal_type: 'treasury',
          execution_data: { requested_amount: amount },
          voting_starts_at: new Date().toISOString(),
          voting_ends_at: votingEndsAt.toISOString(),
          status: 'active',
          votes_for: 0,
          votes_against: 0,
          votes_abstain: 0,
          quorum_required: 100, // Default quorum
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toast({
        title: "Proposal Created",
        description: "Your funding proposal has been submitted successfully.",
      })

      // Reset form
      setProposalTitle('')
      setProposalDescription('')
      setRequestedAmount('')

      // Refresh proposals
      fetchTreasuryData()

    } catch (error) {
      console.error('Error creating proposal:', error)
      toast({
        title: "Error",
        description: "Failed to create funding proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#64f2d1] rounded-full mb-4 shadow-lg shadow-[#64f2d1]/20">
          <Building2 className="h-8 w-8 text-[#111827]" />
        </div>
        <h1 className="text-4xl font-bold text-text-primary">DAO Treasury</h1>
        <p className="text-text-secondary text-lg mt-2">Transparent financial management for the Orca Network ecosystem</p>
      </div>

      {/* Treasury Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface border-border-accent hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-primary">Total Treasury</CardTitle>
            <div className="p-2 bg-[#64f2d1] rounded-lg">
              <Building2 className="h-4 w-4 text-[#111827]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-text-primary">${treasuryBalance.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <p className="text-sm text-success font-medium">+12.5% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border-accent hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-primary">Monthly Revenue</CardTitle>
            <div className="p-2 bg-[#64f2d1] rounded-lg">
              <TrendingUp className="h-4 w-4 text-[#111827]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-text-primary">${monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <p className="text-sm text-success font-medium">+8.7% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border-accent hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-primary">Monthly Expenses</CardTitle>
            <div className="p-2 bg-[#64f2d1] rounded-lg">
              <TrendingDown className="h-4 w-4 text-[#111827]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-text-primary">${monthlyExpenses.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-accent-tertiary mr-1" />
              <p className="text-sm text-accent-tertiary font-medium">+5.2% from last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="proposals">Funding Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="hover:shadow-xl transition-shadow bg-surface">
              <CardHeader className="bg-surface-hover">
                <CardTitle className="flex items-center text-text-primary">
                  <TrendingUp className="mr-2 h-5 w-5 text-accent-tertiary" />
                  Revenue vs Expenses
                </CardTitle>
                <CardDescription className="text-text-secondary">Monthly treasury performance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Allocation Chart */}
            <Card className="hover:shadow-xl transition-shadow bg-surface">
              <CardHeader className="bg-surface-hover">
                <CardTitle className="flex items-center text-text-primary">
                  <Building2 className="mr-2 h-5 w-5 text-accent-tertiary" />
                  Fund Allocation
                </CardTitle>
                <CardDescription className="text-text-secondary">Strategic distribution of treasury resources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All treasury transactions and movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Transactions Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Treasury transactions will appear here once the DAO starts operating
                    </p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {transaction.transaction_type === 'revenue' ? '+' : '-'}
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <Badge className={getTransactionColor(transaction.transaction_type)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          {/* Create Funding Proposal */}
          <Card className="bg-surface">
            <CardHeader className="bg-surface-hover">
              <CardTitle className="flex items-center text-text-primary">
                <div className="p-2 bg-[#64f2d1] rounded-lg mr-3">
                  <Plus className="h-5 w-5 text-[#111827]" />
                </div>
                Submit Funding Proposal
              </CardTitle>
              <CardDescription className="text-text-secondary">Request treasury funds for community projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="funding-title" className="text-text-primary">Project Title</Label>
                <Input
                  id="funding-title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="bg-surface-hover border-border text-text-primary placeholder-text-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="funding-amount" className="text-text-primary">Requested Amount ($)</Label>
                <Input
                  id="funding-amount"
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="Enter amount in USD"
                  className="bg-surface-hover border-border text-text-primary placeholder-text-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="funding-description" className="text-text-primary">Project Description</Label>
                <Textarea
                  id="funding-description"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Describe your project, goals, timeline, and how funds will be used..."
                  rows={4}
                  className="bg-surface-hover border-border text-text-primary placeholder-text-muted"
                />
              </div>
              
              <Button 
                onClick={handleCreateFundingProposal}
                variant="default"
                className="w-full"
                disabled={!proposalTitle || !proposalDescription || !requestedAmount || creating}
              >
                <Plus className="mr-2 h-4 w-4" />
                {creating ? 'Submitting...' : 'Submit Funding Proposal'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Funding Proposals */}
          <Card className="bg-surface">
            <CardHeader className="bg-surface-hover">
              <CardTitle className="text-text-primary">Community Funding Proposals</CardTitle>
              <CardDescription className="text-text-secondary">Active and past funding requests</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {fundingProposals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-text-muted mb-4" />
                  <h3 className="font-medium mb-2 text-text-primary">No Funding Proposals Yet</h3>
                  <p className="text-sm text-text-secondary">
                    Be the first to submit a funding proposal for the community
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fundingProposals.map((proposal) => (
                    <div key={proposal.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-text-primary">{proposal.title}</h4>
                        <Badge className={`${getStatusColor(proposal.status)} text-white`}>
                          {proposal.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-text-secondary text-sm mb-3">{proposal.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted">
                          Created: {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-accent-tertiary font-semibold">
                          Voting ends: {new Date(proposal.voting_ends_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}