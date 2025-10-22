'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Lock, Users, TrendingUp, ArrowUpDown, Gift } from 'lucide-react'
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
      setTokenBalance(balanceData)
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

    const { error } = await supabase
      .from('token_balances')
      .update({
        balance: tokenBalance.balance - amount,
        staked_balance: tokenBalance.staked_balance + amount,
        voting_power: tokenBalance.voting_power + amount * 1.5 // 1.5x voting power for staked tokens
      })
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Staked ${amount} ORCA tokens successfully!`,
      })
      setStakeAmount('')
      fetchTokenData()
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

    // Calculate available_at as 7 days from now
    const availableAt = new Date()
    availableAt.setDate(availableAt.getDate() + 7)

    // Start transaction
    const { error: unstakeError } = await supabase.rpc('unstake_tokens', {
      p_user_id: user.id,
      p_amount: amount,
      p_available_at: availableAt.toISOString()
    })

    if (unstakeError) {
      toast({
        title: "Error",
        description: unstakeError.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Unstaking request for ${amount} ORCA tokens submitted! Tokens will be available in 7 days.`,
      })
      setUnstakeAmount('')
      fetchTokenData()
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

    const { error } = await supabase
      .from('token_delegations')
      .insert({
        delegator_id: user.id,
        delegate_id: delegateAddress,
        amount: amount
      })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: `Delegated ${amount} voting power successfully!`,
      })
      setDelegateAmount('')
      setDelegateAddress('')
      fetchTokenData()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">ORCA Tokens</h1>
        <p className="text-muted-foreground text-lg mt-2">Maximize your governance power and earn rewards through staking</p>
      </div>

      {/* Token Overview */}
      {tokenBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-cyan-500/20 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">ORCA Balance</CardTitle>
              <div className="p-2 bg-cyan-600 rounded-lg">
                <Coins className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{tokenBalance.balance.toLocaleString()}</div>
              <p className="text-sm text-cyan-400 font-medium">Available tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-cyan-500/20 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Staked</CardTitle>
              <div className="p-2 bg-cyan-600 rounded-lg">
                <Lock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{tokenBalance.staked_balance.toLocaleString()}</div>
              <p className="text-sm text-green-400 font-medium">Earning 8% APY</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-cyan-500/20 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Voting Power</CardTitle>
              <div className="p-2 bg-cyan-600 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{tokenBalance.voting_power.toLocaleString()}</div>
              <p className="text-sm text-cyan-400 font-medium">Governance weight</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-cyan-500/20 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Value</CardTitle>
              <div className="p-2 bg-cyan-600 rounded-lg">
                <ArrowUpDown className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {(tokenBalance.balance + tokenBalance.staked_balance).toLocaleString()}
              </div>
              <p className="text-sm text-cyan-400 font-medium">All tokens owned</p>
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
            <Card className="hover:shadow-xl transition-shadow border-l-4 border-l-cyan-500 bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700">
                <CardTitle className="flex items-center text-white">
                  <div className="p-2 bg-cyan-600 rounded-lg mr-3">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  Stake Tokens
                </CardTitle>
                <CardDescription className="text-gray-300">
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
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg" 
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

            <Card className="hover:shadow-xl transition-shadow border-l-4 border-l-cyan-500 bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700">
                <CardTitle className="flex items-center text-white">
                  <div className="p-2 bg-cyan-600 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Staking Rewards
                </CardTitle>
                <CardDescription className="text-gray-300">Your current staking performance and earnings</CardDescription>
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
                  <h3 className="font-medium mb-2">No Rewards Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rewards will be available for claiming once the staking system is fully active
                  </p>
                  <Button variant="outline" disabled>
                    Claim Rewards
                  </Button>
                </div>
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