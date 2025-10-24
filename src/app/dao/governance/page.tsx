'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Vote, Clock, CheckCircle, XCircle, Users, TrendingUp, Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Proposal {
  id: string
  title: string
  description: string
  proposal_type: string
  status: string
  votes_for: number
  votes_against: number
  votes_abstain: number
  voting_ends_at: string
  quorum_required: number
  creator_id: string
}

interface TokenBalance {
  balance: number
  voting_power: number
  staked_balance: number
}

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposalTitle, setProposalTitle] = useState('')
  const [proposalDescription, setProposalDescription] = useState('')
  const [proposalType, setProposalType] = useState('')
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch proposals
    const { data: proposalsData } = await supabase
      .from('dao_proposals')
      .select('*')
      .order('created_at', { ascending: false })

    if (proposalsData) {
      setProposals(proposalsData)
    }

    // Fetch user token balance
    const { data: balanceData } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (balanceData) {
      setTokenBalance(balanceData)
    }

    setLoading(false)
  }

  const castVote = async (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !tokenBalance) return

    const { error } = await supabase
      .from('dao_votes')
      .insert({
        proposal_id: proposalId,
        voter_id: user.id,
        vote_type: voteType,
        voting_power: tokenBalance.voting_power
      })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Vote Cast",
        description: `Your ${voteType} vote has been recorded!`,
      })
      fetchData()
    }
  }

  const handleCreateProposal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !tokenBalance || tokenBalance.voting_power < 100) return

    setCreating(true)

    const votingStartsAt = new Date()
    const votingEndsAt = new Date()
    votingEndsAt.setDate(votingEndsAt.getDate() + 7) // 7 days voting period

    const { error } = await supabase
      .from('dao_proposals')
      .insert({
        creator_id: user.id,
        title: proposalTitle,
        description: proposalDescription,
        proposal_type: proposalType,
        voting_starts_at: votingStartsAt.toISOString(),
        voting_ends_at: votingEndsAt.toISOString(),
        status: 'active',
        quorum_required: 1000000
      })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Proposal Created",
        description: "Your proposal has been submitted for community voting!",
      })
      setProposalTitle('')
      setProposalDescription('')
      setProposalType('')
      fetchData()
    }
    setCreating(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500'
      case 'passed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'executed': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fee_change': return '💰'
      case 'treasury': return '🏛️'
      case 'feature': return '⚡'
      case 'agent_curation': return '🤖'
      default: return '📋'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4">
          <Vote className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">DAO Governance</h1>
        <p className="text-muted-foreground text-lg mt-2">Shape the future of Orca Network through community governance</p>
      </div>

      {/* Token Balance Card */}
      {tokenBalance && (
        <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <div className="p-2 bg-cyan-600 rounded-lg mr-3">
                <Vote className="h-5 w-5 text-white" />
              </div>
              Your Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-gray-700 rounded-lg shadow-sm mb-2">
                  <p className="text-sm text-gray-300 mb-1">ORCA Balance</p>
                  <p className="text-3xl font-bold text-white">{tokenBalance.balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="p-3 bg-gray-700 rounded-lg shadow-sm mb-2">
                  <p className="text-sm text-gray-300 mb-1">Staked</p>
                  <p className="text-3xl font-bold text-cyan-400">{tokenBalance.staked_balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg shadow-sm mb-2">
                  <p className="text-sm text-cyan-100 mb-1">Voting Power</p>
                  <p className="text-3xl font-bold text-white">{tokenBalance.voting_power.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Proposals</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {proposals.filter(p => p.status === 'active').map((proposal) => {
            const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain
            const forPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0
            const againstPercentage = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0
            const quorumProgress = (totalVotes / proposal.quorum_required) * 100

            return (
              <Card key={proposal.id} className="hover:shadow-xl transition-shadow border-l-4 border-l-cyan-500 bg-gray-800">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center text-lg text-white">
                        <div className="p-2 bg-cyan-600 rounded-lg mr-3">
                          <span className="text-lg">{getTypeIcon(proposal.proposal_type)}</span>
                        </div>
                        {proposal.title}
                      </CardTitle>
                      <CardDescription className="mt-3 text-base leading-relaxed text-gray-300">{proposal.description}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(proposal.status)} text-white font-semibold px-3 py-1`}>
                      {proposal.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Voting Results */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-900/30 border border-green-500/30 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-300">For</span>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          </div>
                          <p className="text-xl font-bold text-green-400">{proposal.votes_for.toLocaleString()}</p>
                          <p className="text-sm text-green-300">{forPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="bg-red-900/30 border border-red-500/30 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-300">Against</span>
                            <XCircle className="h-4 w-4 text-red-400" />
                          </div>
                          <p className="text-xl font-bold text-red-400">{proposal.votes_against.toLocaleString()}</p>
                          <p className="text-sm text-red-300">{againstPercentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-300">
                          <span>Voting Progress</span>
                          <span>{forPercentage.toFixed(1)}% For</span>
                        </div>
                        <Progress value={forPercentage} className="h-3 bg-gray-700" />
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-medium text-gray-300">Quorum: {quorumProgress.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm text-gray-300">Ends: {new Date(proposal.voting_ends_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Voting Buttons */}
                    {tokenBalance && tokenBalance.voting_power > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <Button 
                          onClick={() => castVote(proposal.id, 'for')}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Vote For
                        </Button>
                        <Button 
                          onClick={() => castVote(proposal.id, 'against')}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Against
                        </Button>
                        <Button 
                          onClick={() => castVote(proposal.id, 'abstain')}
                          variant="outline"
                          className="border-2 border-gray-600 text-gray-300 hover:bg-gray-700 shadow-lg"
                        >
                          Abstain
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {proposals.filter(p => p.status !== 'active').map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center">
                    <span className="mr-2">{getTypeIcon(proposal.proposal_type)}</span>
                    {proposal.title}
                  </CardTitle>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">For</p>
                    <p className="font-semibold">{proposal.votes_for.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Against</p>
                    <p className="font-semibold">{proposal.votes_against.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Abstain</p>
                    <p className="font-semibold">{proposal.votes_abstain.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="create">
          <Card className="bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700">
              <CardTitle className="flex items-center text-white">
                <div className="p-2 bg-cyan-600 rounded-lg mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                Create New Proposal
              </CardTitle>
              <CardDescription className="text-gray-300">Submit a proposal for community voting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label htmlFor="proposal-type" className="text-white">Proposal Type</Label>
                <Select value={proposalType} onValueChange={setProposalType}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select proposal type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="fee_change" className="text-white">💰 Fee Change</SelectItem>
                    <SelectItem value="treasury" className="text-white">🏛️ Treasury Allocation</SelectItem>
                    <SelectItem value="feature" className="text-white">⚡ New Feature</SelectItem>
                    <SelectItem value="agent_curation" className="text-white">🤖 Agent Curation</SelectItem>
                    <SelectItem value="other" className="text-white">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="proposal-title" className="text-white">Title</Label>
                <Input
                  id="proposal-title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Enter proposal title"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="proposal-description" className="text-white">Description</Label>
                <Textarea
                  id="proposal-description"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Provide detailed description of your proposal..."
                  rows={6}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              {tokenBalance && tokenBalance.voting_power >= 100 ? (
                <Button 
                  onClick={handleCreateProposal}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
                  disabled={!proposalTitle || !proposalDescription || !proposalType || creating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? 'Creating...' : 'Create Proposal'}
                </Button>
              ) : (
                <div className="text-center p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    You need at least 100 voting power to create proposals.
                    Current: {tokenBalance?.voting_power.toLocaleString() || 0}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}