import { Router, Request, Response } from 'express'
import { createClient } from '@/lib/supabase/server'
import { blockchainService } from '../services/blockchain'

const router = Router()

// GET /api/tokens/balance/:userId - Get user token balance
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const supabase = createClient()

    const { data: balance, error } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !balance) {
      return res.status(404).json({ error: 'Balance not found' })
    }

    res.json(balance)
  } catch (error) {
    console.error('Error fetching token balance:', error)
    res.status(500).json({ error: 'Failed to fetch token balance' })
  }
})

// POST /api/tokens/stake - Stake tokens
router.post('/stake', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const supabase = createClient()

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balanceData) {
      return res.status(400).json({ error: 'Balance not found' })
    }

    if (balanceData.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    // Update local balance
    const newBalance = balanceData.balance - parsedAmount
    const newStakedBalance = balanceData.staked_balance + parsedAmount
    const newVotingPower = newBalance + newStakedBalance * 1.5

    const { error: updateError } = await supabase
      .from('token_balances')
      .update({
        balance: newBalance,
        staked_balance: newStakedBalance,
        voting_power: newVotingPower,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update balance' })
    }

    res.json({
      success: true,
      newBalance,
      newStakedBalance,
      newVotingPower
    })
  } catch (error) {
    console.error('Error staking tokens:', error)
    res.status(500).json({ error: 'Failed to stake tokens' })
  }
})

// POST /api/tokens/unstake - Request unstaking
router.post('/unstake', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const supabase = createClient()

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balanceData) {
      return res.status(400).json({ error: 'Balance not found' })
    }

    if (balanceData.staked_balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient staked balance' })
    }

    // Create unstaking request
    const availableAt = new Date()
    availableAt.setDate(availableAt.getDate() + 7) // 7-day unstaking period

    const { data: unstakingRequest, error: unstakingError } = await supabase
      .from('unstaking_requests')
      .insert({
        user_id: userId,
        amount: parsedAmount,
        available_at: availableAt.toISOString(),
        status: 'PENDING'
      })
      .select()
      .single()

    if (unstakingError) {
      return res.status(500).json({ error: 'Failed to create unstaking request' })
    }

    res.json({
      unstakingRequest,
      success: true
    })
  } catch (error) {
    console.error('Error requesting unstake:', error)
    res.status(500).json({ error: 'Failed to request unstake' })
  }
})

// POST /api/tokens/delegate - Delegate voting power
router.post('/delegate', async (req: Request, res: Response) => {
  try {
    const { delegatorId, delegateId, amount } = req.body

    if (!delegatorId || !delegateId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const supabase = createClient()

    // Check if delegator has enough voting power
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegatorId)
      .single()

    if (balanceError || !balanceData) {
      return res.status(400).json({ error: 'Balance not found' })
    }

    if (balanceData.voting_power < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient voting power' })
    }

    // Check if delegation already exists
    const { data: existingDelegation, error: delegationError } = await supabase
      .from('token_delegations')
      .select('*')
      .eq('delegator_id', delegatorId)
      .eq('delegate_id', delegateId)
      .single()

    let difference = parsedAmount
    if (existingDelegation) {
      difference = parsedAmount - existingDelegation.amount
      // Update existing delegation
      const { error: updateError } = await supabase
        .from('token_delegations')
        .update({ amount: parsedAmount })
        .eq('id', existingDelegation.id)

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update delegation' })
      }
    } else {
      // Create new delegation
      const { error: createError } = await supabase
        .from('token_delegations')
        .insert({
          delegator_id: delegatorId,
          delegate_id: delegateId,
          amount: parsedAmount
        })

      if (createError) {
        return res.status(500).json({ error: 'Failed to create delegation' })
      }
    }

    // Update voting powers
    if (difference !== 0) {
      const { error: updateDelegatorError } = await supabase
        .from('token_balances')
        .update({ voting_power: balanceData.voting_power - difference })
        .eq('user_id', delegatorId)

      if (updateDelegatorError) {
        return res.status(500).json({ error: 'Failed to update delegator voting power' })
      }

      const { data: delegateBalance, error: delegateBalanceError } = await supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', delegateId)
        .single()

      if (delegateBalanceError || !delegateBalance) {
        return res.status(400).json({ error: 'Delegate balance not found' })
      }

      const { error: updateDelegateError } = await supabase
        .from('token_balances')
        .update({ voting_power: delegateBalance.voting_power + difference })
        .eq('user_id', delegateId)

      if (updateDelegateError) {
        return res.status(500).json({ error: 'Failed to update delegate voting power' })
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error delegating tokens:', error)
    res.status(500).json({ error: 'Failed to delegate tokens' })
  }
})

// GET /api/tokens/delegations/:userId - Get user delegations
router.get('/delegations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const supabase = createClient()

    const { data: delegations, error } = await supabase
      .from('token_delegations')
      .select(`
        *,
        delegator:profiles!delegator_id(id, email),
        delegate:profiles!delegate_id(id, email)
      `)
      .or(`delegator_id.eq.${userId},delegate_id.eq.${userId}`)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch delegations' })
    }

    res.json(delegations)
  } catch (error) {
    console.error('Error fetching delegations:', error)
    res.status(500).json({ error: 'Failed to fetch delegations' })
  }
})

// GET /api/tokens/unstaking/:userId - Get user unstaking requests
router.get('/unstaking/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const supabase = createClient()

    const { data: requests, error } = await supabase
      .from('unstaking_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch unstaking requests' })
    }

    res.json(requests)
  } catch (error) {
    console.error('Error fetching unstaking requests:', error)
    res.status(500).json({ error: 'Failed to fetch unstaking requests' })
  }
})

// POST /api/tokens/claim-rewards - Claim staking rewards
router.post('/claim-rewards', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const supabase = createClient()

    // Calculate and apply rewards (simplified for now)
    const rewardAmount = 0 // TODO: Implement rewards calculation

    // Create reward claim record
    const { data: claimRecord, error: claimError } = await supabase
      .from('dao_treasury')
      .insert({
        transaction_type: 'DISTRIBUTION',
        amount: rewardAmount,
        recipient_id: userId,
        description: 'Staking rewards claim',
        status: 'EXECUTED'
      })
      .select()
      .single()

    if (claimError) {
      return res.status(500).json({ error: 'Failed to create claim record' })
    }

    res.json({
      success: true,
      rewardAmount,
      claimRecord
    })
  } catch (error) {
    console.error('Error claiming rewards:', error)
    res.status(500).json({ error: 'Failed to claim rewards' })
  }
})

// DELETE /api/tokens/delegate/:id - Revoke delegation
router.delete('/delegate/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const supabase = createClient()

    const { data: delegation, error: delegationError } = await supabase
      .from('token_delegations')
      .select('*')
      .eq('id', id)
      .single()

    if (delegationError || !delegation) {
      return res.status(404).json({ error: 'Delegation not found' })
    }

    const amount = delegation.amount

    // Remove delegation
    const { error: deleteError } = await supabase
      .from('token_delegations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete delegation' })
    }

    // Update voting powers
    const { data: delegatorBalance, error: delegatorError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegation.delegator_id)
      .single()

    if (delegatorError || !delegatorBalance) {
      return res.status(400).json({ error: 'Delegator balance not found' })
    }

    const { error: updateDelegatorError } = await supabase
      .from('token_balances')
      .update({ voting_power: delegatorBalance.voting_power + amount })
      .eq('user_id', delegation.delegator_id)

    if (updateDelegatorError) {
      return res.status(500).json({ error: 'Failed to update delegator voting power' })
    }

    const { data: delegateBalance, error: delegateError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', delegation.delegate_id)
      .single()

    if (delegateError || !delegateBalance) {
      return res.status(400).json({ error: 'Delegate balance not found' })
    }

    const { error: updateDelegateError } = await supabase
      .from('token_balances')
      .update({ voting_power: delegateBalance.voting_power - amount })
      .eq('user_id', delegation.delegate_id)

    if (updateDelegateError) {
      return res.status(500).json({ error: 'Failed to update delegate voting power' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error revoking delegation:', error)
    res.status(500).json({ error: 'Failed to revoke delegation' })
  }
})

// POST /api/tokens/add-balance - Add balance to user (admin function)
router.post('/add-balance', async (req: Request, res: Response) => {
  try {
    const { userId, amount, description } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const supabase = createClient()

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError || !balanceData) {
      return res.status(400).json({ error: 'Balance not found' })
    }

    // Update balance and voting power
    const newBalance = balanceData.balance + parsedAmount
    const newVotingPower = balanceData.voting_power + parsedAmount

    const { error: updateError } = await supabase
      .from('token_balances')
      .update({
        balance: newBalance,
        voting_power: newVotingPower,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update balance' })
    }

    // Create treasury transaction record
    const { error: transactionError } = await supabase
      .from('dao_treasury')
      .insert({
        transaction_type: 'DISTRIBUTION',
        amount: parsedAmount,
        recipient_id: userId,
        description: description || 'Balance addition',
        status: 'EXECUTED'
      })

    if (transactionError) {
      return res.status(500).json({ error: 'Failed to create transaction record' })
    }

    res.json({ success: true, newBalance })
  } catch (error) {
    console.error('Error adding balance:', error)
    res.status(500).json({ error: 'Failed to add balance' })
  }
})

// GET /api/tokens/stats - Get token statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const supabase = createClient()

    const [
      totalSupply,
      totalDelegations,
      activeUnstakingRequests
    ] = await Promise.all([
      supabase.from('token_balances').select('balance, staked_balance'),
      supabase.from('token_delegations').select('*', { count: 'exact' }),
      supabase.from('unstaking_requests').select('*', { count: 'exact' }).eq('status', 'PENDING')
    ])

    const totalVotingPower = await supabase.from('token_balances').select('voting_power')

    const totalBalance = totalSupply.data?.reduce((sum, item) => sum + item.balance, 0) || 0
    const totalStaked = totalSupply.data?.reduce((sum, item) => sum + item.staked_balance, 0) || 0
    const totalVP = totalVotingPower.data?.reduce((sum, item) => sum + item.voting_power, 0) || 0

    res.json({
      totalSupply: totalBalance + totalStaked,
      totalStaked,
      totalDelegations: totalDelegations.count || 0,
      activeUnstakingRequests: activeUnstakingRequests.count || 0,
      totalVotingPower: totalVP
    })
  } catch (error) {
    console.error('Error fetching token stats:', error)
    res.status(500).json({ error: 'Failed to fetch token statistics' })
  }
})

export { router as tokenRoutes }