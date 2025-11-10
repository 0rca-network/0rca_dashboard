'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Lock, Users, TrendingUp, ArrowUpDown, Gift, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TokenBalance {
  balance: number
  staked_balance: number
  voting_power: number
}

interface Delegation {
  id: string
  delegate_id: string
  amount: number
  created_at: string
}

interface UnstakingRequest {
  id: string
  amount: number
  requested_at: string
  available_at: string
  status: 'pending' | 'completed'
}

export default function TokensPage() {
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [unstakingRequests, setUnstakingRequests] = useState<UnstakingRequest[]>([])
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [delegateAddress, setDelegateAddress] = useState('')
  const [delegateAmount, setDelegateAmount] = useState('')
  const [addBalanceAmount, setAddBalanceAmount] = useState('')
  const [addBalanceDescription, setAddBalanceDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTokenData()
  }, [])

  const fetchTokenData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch token balance
    const { data: balanceData } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (balanceData) {
      // If balance is less than 100, update to 100
      if (balanceData.balance < 100) {
        const { data: updateData } = await supabase
          .from('token_balances')
          .update({ balance: 100, voting_power: 100 })
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateData) {
          setTokenBalance(updateData)
        } else {
          setTokenBalance(balanceData)
        }
      } else {
        setTokenBalance(balanceData)
      }
    } else {
      // If not exists, create with default balance
      const { data: insertData } = await supabase
        .from('token_balances')
        .insert({ user_id: user.id, balance: 100, voting_power: 100 })
        .select()
        .single()

      if (insertData) {
        setTokenBalance(insertData)
      }
    }

    // Fetch delegations
    const { data: delegationsData } = await supabase
      .from('token_delegations')
      .select('*')
      .eq('delegator_id', user.id)

    if (delegationsData) {
      setDelegations(delegationsData)
    }

    // Fetch unstaking requests
    const { data: unstakingData } = await supabase
      .from('unstaking_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    if (unstakingData) {
      setUnstakingRequests(unstakingData)
    }

    setLoading(false)
  }

  const handleStake = async () => {
    if (!tokenBalance || !stakeAmount) return

    const amount = parseFloat(stakeAmount)
    if (amount > tokenBalance.balance) {
      toast({
        title: "Error",
        description: "Insufficient balance to stake",
        variant: "destructive",
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/tokens/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to stake tokens')
      }

      toast({
        title: "Success",
        description: `Staked ${amount} ORCA tokens successfully!`,
      })
      setStakeAmount('')
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUnstake = async () => {
    if (!tokenBalance || !unstakeAmount) return

    const amount = parseFloat(unstakeAmount)
    if (amount > tokenBalance.staked_balance) {
      toast({
        title: "Error",
        description: "Insufficient staked balance to unstake",
        variant: "destructive",
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/tokens/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request unstake')
      }

      toast({
        title: "Success",
        description: `Unstaking request for ${amount} ORCA tokens submitted! Tokens will be available in 7 days.`,
      })
      setUnstakeAmount('')
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelegate = async () => {
    if (!tokenBalance || !delegateAmount || !delegateAddress) return

    const amount = parseFloat(delegateAmount)
    if (amount > tokenBalance.voting_power) {
      toast({
        title: "Error",
        description: "Insufficient voting power to delegate",
        variant: "destructive",
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/tokens/delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegatorId: user.id, delegateId: delegateAddress, amount })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delegate voting power')
      }

      toast({
        title: "Success",
        description: `Delegated ${amount} voting power successfully!`,
      })
      setDelegateAmount('')
      setDelegateAddress('')
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRevoke = async (delegationId: string) => {
    try {
      const response = await fetch(`/api/tokens/delegate/${delegationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke delegation')
      }

      toast({
        title: "Success",
        description: "Delegation revoked successfully!",
      })
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleClaimRewards = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/tokens/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim rewards')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `Claimed ${data.rewardAmount.toFixed(8)} ORCA rewards!`,
      })
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddBalance = async () => {
    if (!addBalanceAmount || !addBalanceDescription) return

    const amount = parseFloat(addBalanceAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const response = await fetch('/api/tokens/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, description: addBalanceDescription })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add balance')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `Added ${amount} ORCA to balance!`,
      })
      setAddBalanceAmount('')
      setAddBalanceDescription('')
      fetchTokenData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#64f2d1] rounded-full mb-4 shadow-lg shadow-[#64f2d1]/20">
          <Coins className="h-8 w-8 text-[#111827]" />
        </div>
        <h1 className="text-4xl font-bold text-text-primary">ORCA Tokens</h1>
        <p className="text-text-secondary text-lg mt-2">Maximize your governance power and earn rewards through staking</p>
      </div>

      {/* Token Overview */}
      {tokenBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-surface border-border-accent hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">ORCA Balance</CardTitle>
              <div className="p-2 bg-[#64f2d1] rounded-lg">
                <Coins className="h-4 w-4 text-[#111827]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">{tokenBalance.balance.toLocaleString()}</div>
              <p className="text-sm text-accent-tertiary font-medium">Available tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border-accent hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">Staked</CardTitle>
              <div className="p-2 bg-[#64f2d1] rounded-lg">
                <Lock className="h-4 w-4 text-[#111827]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">{tokenBalance.staked_balance.toLocaleString()}</div>
              <p className="text-sm text-success font-medium">Earning 8% APY</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border-accent hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">Voting Power</CardTitle>
              <div className="p-2 bg-[#64f2d1] rounded-lg">
                <TrendingUp className="h-4 w-4 text-[#111827]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">{tokenBalance.voting_power.toLocaleString()}</div>
              <p className="text-sm text-accent-tertiary font-medium">Governance weight</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border-accent hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">Total Value</CardTitle>
              <div className="p-2 bg-[#64f2d1] rounded-lg">
                <ArrowUpDown className="h-4 w-4 text-[#111827]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {(tokenBalance.balance + tokenBalance.staked_balance).toLocaleString()}
              </div>
              <p className="text-sm text-accent-tertiary font-medium">All tokens owned</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stake">Stake & Rewards</TabsTrigger>
          <TabsTrigger value="delegate">Delegate</TabsTrigger>
          <TabsTrigger value="claim">Claim Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-xl transition-shadow border-l-4 border-l-accent-tertiary bg-surface">
              <CardHeader className="bg-surface-hover">
                <CardTitle className="flex items-center text-text-primary">
                  <div className="p-2 bg-[#64f2d1] rounded-lg mr-3">
                    <Lock className="h-5 w-5 text-[#111827]" />
                  </div>
                  Stake Tokens
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  Stake ORCA tokens to earn 8% APY and increase voting power by 1.5x
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stake-amount">Amount to Stake</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {tokenBalance?.balance.toLocaleString() || 0} ORCA
                  </p>
                </div>
                <Button 
                  onClick={handleStake} 
                  variant="default"
                  className="w-full" 
                  disabled={!stakeAmount}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Stake Tokens
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• Staked tokens earn 8% APY</p>
                  <p>• 1.5x voting power multiplier</p>
                  <p>• 7-day unstaking period</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-l-4 border-l-accent-tertiary bg-surface">
              <CardHeader className="bg-surface-hover">
                <CardTitle className="flex items-center text-text-primary">
                  <div className="p-2 bg-[#64f2d1] rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-[#111827]" />
                  </div>
                  Staking Rewards
                </CardTitle>
                <CardDescription className="text-text-secondary">Your current staking performance and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Staked Amount</span>
                    <span className="font-bold">{tokenBalance?.staked_balance.toLocaleString() || 0} ORCA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Yield</span>
                    <span className="font-bold text-green-600">8.0% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Monthly Rewards</span>
                    <span className="font-bold">
                      {tokenBalance ? ((tokenBalance.staked_balance * 0.08) / 12).toFixed(2) : 0} ORCA
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                    <Input
                      id="unstake-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: {tokenBalance?.staked_balance.toLocaleString() || 0} ORCA
                    </p>
                  </div>
                  <Button
                    onClick={handleUnstake}
                    variant="outline"
                    className="w-full"
                    disabled={!unstakeAmount || !tokenBalance?.staked_balance}
                  >
                    Unstake Tokens
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delegate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Delegate Voting Power
                </CardTitle>
                <CardDescription>
                  Delegate your voting power to another address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="delegate-address">Delegate Address</Label>
                  <Input
                    id="delegate-address"
                    placeholder="Enter wallet address or user ID"
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delegate-amount">Voting Power to Delegate</Label>
                  <Input
                    id="delegate-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={delegateAmount}
                    onChange={(e) => setDelegateAmount(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {tokenBalance?.voting_power.toLocaleString() || 0} voting power
                  </p>
                </div>
                <Button 
                  onClick={handleDelegate} 
                  className="w-full" 
                  disabled={!delegateAddress || !delegateAmount}
                >
                  Delegate Voting Power
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Delegations</CardTitle>
                <CardDescription>Your current voting power delegations</CardDescription>
              </CardHeader>
              <CardContent>
                {delegations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Active Delegations</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven't delegated any voting power yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {delegations.map((delegation) => (
                      <div key={delegation.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Delegate: {delegation.delegate_id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(delegation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{delegation.amount.toLocaleString()}</p>
                          <Button variant="outline" size="sm">
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claim">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="mr-2 h-5 w-5" />
                  Claim Rewards
                </CardTitle>
                <CardDescription>Claim your staking and governance participation rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Claim Staking Rewards</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Claim your accumulated staking rewards
                  </p>
                  <Button onClick={handleClaimRewards} className="w-full">
                    Claim Rewards
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Balance
                </CardTitle>
                <CardDescription>Add tokens to your balance (Admin function)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="add-amount">Amount</Label>
                  <Input
                    id="add-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={addBalanceAmount}
                    onChange={(e) => setAddBalanceAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-description">Description</Label>
                  <Input
                    id="add-description"
                    placeholder="Reason for adding balance"
                    value={addBalanceDescription}
                    onChange={(e) => setAddBalanceDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddBalance}
                  className="w-full"
                  disabled={!addBalanceAmount || !addBalanceDescription}
                >
                  Add Balance
                </Button>
                <p className="text-xs text-muted-foreground">
                  Note: This function is intended for administrative use or testing purposes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unstaking Requests</CardTitle>
                <CardDescription>Your pending unstaking requests</CardDescription>
              </CardHeader>
              <CardContent>
                {unstakingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Unstaking Requests</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven't requested to unstake any tokens yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unstakingRequests.map((request) => (
                      <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{request.amount.toLocaleString()} ORCA</p>
                          <p className="text-sm text-muted-foreground">
                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Available: {new Date(request.available_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}