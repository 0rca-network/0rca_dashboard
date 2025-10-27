import { Router, Request, Response } from 'express'
import { createClient } from '@/lib/supabase/server'
import { blockchainService } from '../services/blockchain'

const router = Router()

// GET /api/treasury/summary - Get treasury summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const treasuryBalance = await blockchainService.getTreasuryBalance()
    const tokenPrice = await blockchainService.getTokenPrice()
    const usdValue = treasuryBalance * tokenPrice

    // Get recent transactions
    const supabase = createClient()

    const { data: recentTransactions, error: recentError } = await supabase
      .from('dao_treasury')
      .select(`*, recipient:profiles(id, email)`)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate monthly stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: monthlyTransactions, error } = await supabase
      .from('dao_treasury')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const monthlyRevenue = (monthlyTransactions || [])
      .filter(t => t.transaction_type === 'REVENUE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyExpenses = (monthlyTransactions || [])
      .filter(t => t.transaction_type === 'EXPENSE' || t.transaction_type === 'GRANT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    res.json({
      totalBalance: treasuryBalance,
      usdValue,
      tokenPrice,
      monthlyRevenue,
      monthlyExpenses,
      recentTransactions
    })
  } catch (error) {
    console.error('Error fetching treasury summary:', error)
    res.status(500).json({ error: 'Failed to fetch treasury summary' })
  }
})

// GET /api/treasury/transactions - Get treasury transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query

    const where: any = {}
    if (type) where.transactionType = type

    const supabase = createClient()

    let query = supabase
      .from('dao_treasury')
      .select(`*, recipient:profiles(id, email)`)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

    if (type) query = query.eq('transaction_type', type)

    const { data: transactions, error } = await query

    let countQuery = supabase
      .from('dao_treasury')
      .select('*', { count: 'exact', head: true })

    if (type) countQuery = countQuery.eq('transaction_type', type)

    const { count: totalCount, error: countError } = await countQuery

    res.json({
      transactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error) {
    console.error('Error fetching treasury transactions:', error)
    res.status(500).json({ error: 'Failed to fetch treasury transactions' })
  }
})

// POST /api/treasury/funding-proposal - Create funding proposal
router.post('/funding-proposal', async (req: Request, res: Response) => {
  try {
    const { userId, title, description, requestedAmount } = req.body

    if (!userId || !title || !description || !requestedAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const amount = parseFloat(requestedAmount)
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Check if user has enough voting power to create proposal
    const { syncService } = await import('../services/sync-service')
    const tokenBalances = await syncService.syncUserBalance(userId)

    if (tokenBalances.votingPower.toNumber() < 100) {
      return res.status(403).json({ error: 'Insufficient voting power to create proposal' })
    }

    const votingEndsAt = new Date()
    votingEndsAt.setDate(votingEndsAt.getDate() + 7)

    const supabase = createClient()

    const { data: proposal, error } = await supabase
      .from('dao_proposals')
      .insert({
        creator_id: userId,
        title,
        description,
        proposal_type: 'TREASURY',
        execution_data: {
          requestedAmount: amount,
          treasuryAllocation: true
        },
        voting_starts_at: new Date().toISOString(),
        voting_ends_at: votingEndsAt.toISOString(),
        status: 'ACTIVE',
        quorum_required: 1000000
      })
      .select(`*, creator:profiles(id, email)`)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create funding proposal' })
    }

    res.json(proposal)
  } catch (error) {
    console.error('Error creating funding proposal:', error)
    res.status(500).json({ error: 'Failed to create funding proposal' })
  }
})

// GET /api/treasury/proposals - Get treasury funding proposals
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { status } = req.query

    const where: any = { proposalType: 'TREASURY' }
    if (status) where.status = status

    const supabase = createClient()

    let query = supabase
      .from('dao_proposals')
      .select(`*, creator:profiles(id, email), votes:dao_votes(*, voter:profiles(id, email))`)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data: proposals, error } = await query

    res.json(proposals)
  } catch (error) {
    console.error('Error fetching treasury proposals:', error)
    res.status(500).json({ error: 'Failed to fetch treasury proposals' })
  }
})

// POST /api/treasury/expense - Record treasury expense
router.post('/expense', async (req: Request, res: Response) => {
  try {
    const { proposalId, amount, description, recipientId } = req.body

    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Check treasury balance
    const treasuryBalance = await blockchainService.getTreasuryBalance()
    const tokenPrice = await blockchainService.getTokenPrice()
    const availableFunds = treasuryBalance * tokenPrice

    if (parsedAmount > availableFunds) {
      return res.status(400).json({ error: 'Insufficient treasury funds' })
    }

    const supabase = createClient()

    const { data: transaction, error } = await supabase
      .from('dao_treasury')
      .insert({
        proposal_id: proposalId,
        transaction_type: 'EXPENSE',
        amount: parsedAmount,
        recipient_id: recipientId,
        description,
        status: 'PENDING'
      })
      .select(`*, recipient:profiles(id, email)`)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to record treasury expense' })
    }

    res.json(transaction)
  } catch (error) {
    console.error('Error recording treasury expense:', error)
    res.status(500).json({ error: 'Failed to record treasury expense' })
  }
})

// POST /api/treasury/revenue - Record treasury revenue
router.post('/revenue', async (req: Request, res: Response) => {
  try {
    const { amount, description } = req.body

    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const supabase = createClient()

    const { data: transaction, error } = await supabase
      .from('dao_treasury')
      .insert({
        transaction_type: 'REVENUE',
        amount: parsedAmount,
        description,
        status: 'EXECUTED'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to record treasury revenue' })
    }

    res.json(transaction)
  } catch (error) {
    console.error('Error recording treasury revenue:', error)
    res.status(500).json({ error: 'Failed to record treasury revenue' })
  }
})

// POST /api/treasury/distribute - Distribute tokens from treasury
router.post('/distribute', async (req: Request, res: Response) => {
  try {
    const { recipientId, amount, description } = req.body

    if (!recipientId || !amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Check treasury balance (mock check)
    const treasuryBalance = await blockchainService.getTreasuryBalance()
    if (treasuryBalance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient treasury balance' })
    }

    // Add to user's balance
    const { syncService } = await import('../services/sync-service')
    const balance = await syncService.syncUserBalance(recipientId)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('token_balances')
      .update({
        balance: { increment: parsedAmount },
        voting_power: { increment: parsedAmount },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', recipientId)

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update balance' })
    }

    // Create treasury transaction
    const { data: transaction, error: createError } = await supabase
      .from('dao_treasury')
      .insert({
        transaction_type: 'DISTRIBUTION',
        amount: parsedAmount,
        recipient_id: recipientId,
        description,
        status: 'EXECUTED'
      })
      .select(`*, recipient:profiles(id, email)`)
      .single()

    if (createError) {
      return res.status(500).json({ error: 'Failed to create transaction record' })
    }

    res.json({
      success: true,
      transaction,
      newBalance: balance.balance.toNumber() + parsedAmount
    })
  } catch (error) {
    console.error('Error distributing tokens:', error)
    res.status(500).json({ error: 'Failed to distribute tokens' })
  }
})

// GET /api/treasury/analytics - Get treasury analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const [
      monthlyTransactions,
      quarterlyTransactions,
      totalExpenses,
      totalRevenue
    ] = await Promise.all([
      prisma.treasuryTransactions.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.treasuryTransactions.findMany({
        where: {
          createdAt: {
            gte: ninetyDaysAgo
          }
        }
      }),
      prisma.treasuryTransactions.aggregate({
        where: {
          transactionType: {
            in: ['EXPENSE', 'GRANT']
          }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.treasuryTransactions.aggregate({
        where: {
          transactionType: 'REVENUE'
        },
        _sum: {
          amount: true
        }
      })
    ])

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.transaction_type === 'EXPENSE' || t.transaction_type === 'GRANT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyRevenue = monthlyTransactions
      .filter(t => t.transaction_type === 'REVENUE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const quarterlyExpenses = quarterlyTransactions
      .filter(t => t.transaction_type === 'EXPENSE' || t.transaction_type === 'GRANT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const quarterlyRevenue = quarterlyTransactions
      .filter(t => t.transaction_type === 'REVENUE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    res.json({
      monthly: {
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        net: monthlyRevenue - monthlyExpenses
      },
      quarterly: {
        revenue: quarterlyRevenue,
        expenses: quarterlyExpenses,
        net: quarterlyRevenue - quarterlyExpenses
      },
      totals: {
        revenue: totalRevenue._sum.amount || 0,
        expenses: totalExpenses._sum.amount || 0,
        net: (totalRevenue._sum.amount?.toNumber() || 0) - (totalExpenses._sum.amount?.toNumber() || 0)
      }
    })
  } catch (error) {
    console.error('Error fetching treasury analytics:', error)
    res.status(500).json({ error: 'Failed to fetch treasury analytics' })
  }
})

export { router as treasuryRoutes }