import { Router, Request, Response } from 'express'
import { db } from '../index'
import { blockchainService } from '../services/blockchain'
import { syncService } from '../services/sync-service'
import { rewardsWorker } from '../workers/rewards-worker'
import { tokenBalances, treasuryTransactions, unstakingRequests, tokenDelegations } from '../../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// GET /api/tokens/balance/:userId - Get user token balance
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const balance = await syncService.syncUserBalance(userId)

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

    // Get current balance
    const balance = await syncService.syncUserBalance(userId)
    if (balance.balance.toNumber() < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    // Create blockchain transaction for staking
    const transaction = await blockchainService.createStakeTransaction(
      userId,
      parsedAmount
    )

    // Update local balance (this would normally be done after blockchain confirmation)
    await prisma.tokenBalance.update({
      where: { userId },
      data: {
        balance: { decrement: parsedAmount },
        stakedBalance: { increment: parsedAmount },
        votingPower: { set: (balance.balance.toNumber() - parsedAmount) + (balance.stakedBalance.toNumber() + parsedAmount) * 1.5 },
        updatedAt: new Date()
      }
    })

    res.json({
      success: true,
      transaction: {
        instructions: transaction.instructions,
        signers: transaction.signers.map(s => s.toString())
      }
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

    // Get current balance
    const balance = await syncService.syncUserBalance(userId)
    if (balance.stakedBalance.toNumber() < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient staked balance' })
    }

    // Create unstaking request
    const availableAt = new Date()
    availableAt.setDate(availableAt.getDate() + 7) // 7-day unstaking period

    const unstakingRequest = await prisma.unstakingRequest.create({
      data: {
        userId,
        amount: parsedAmount,
        availableAt,
        status: 'PENDING'
      }
    })

    // Create blockchain transaction for unstaking
    const transaction = await blockchainService.createUnstakeTransaction(
      userId,
      parsedAmount
    )

    res.json({
      unstakingRequest,
      transaction: {
        instructions: transaction.instructions,
        signers: transaction.signers.map(s => s.toString())
      }
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

    // Check if delegator has enough voting power
    const balance = await syncService.syncUserBalance(delegatorId)
    if (balance.votingPower.toNumber() < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient voting power' })
    }

    // Check if delegation already exists
    const existingDelegation = await prisma.tokenDelegation.findUnique({
      where: {
        delegatorId_delegateId: {
          delegatorId,
          delegateId
        }
      }
    })

    let difference = parsedAmount
    if (existingDelegation) {
      difference = parsedAmount - existingDelegation.amount.toNumber()
      // Update existing delegation
      await prisma.tokenDelegation.update({
        where: { id: existingDelegation.id },
        data: { amount: parsedAmount }
      })
    } else {
      // Create new delegation
      await prisma.tokenDelegation.create({
        data: {
          delegatorId,
          delegateId,
          amount: parsedAmount
        }
      })
    }

    // Update voting powers
    if (difference !== 0) {
      await prisma.tokenBalance.update({
        where: { userId: delegatorId },
        data: { votingPower: { decrement: difference } }
      })

      await prisma.tokenBalance.update({
        where: { userId: delegateId },
        data: { votingPower: { increment: difference } }
      })
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

    const delegations = await prisma.tokenDelegation.findMany({
      where: {
        OR: [
          { delegatorId: userId },
          { delegateId: userId }
        ]
      },
      include: {
        delegator: {
          select: {
            id: true,
            email: true
          }
        },
        delegate: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

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

    const requests = await prisma.unstakingRequest.findMany({
      where: { userId },
      orderBy: {
        requestedAt: 'desc'
      }
    })

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

    // Calculate and apply rewards
    const rewardAmount = await rewardsWorker.calculateRewardsForUser(userId)

    // Create reward claim record
    const claimRecord = await prisma.treasuryTransaction.create({
      data: {
        transactionType: 'DISTRIBUTION',
        amount: rewardAmount,
        recipientId: userId,
        description: 'Staking rewards claim',
        status: 'EXECUTED'
      }
    })

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

    const delegation = await prisma.tokenDelegation.findUnique({
      where: { id }
    })

    if (!delegation) {
      return res.status(404).json({ error: 'Delegation not found' })
    }

    const amount = delegation.amount.toNumber()

    // Remove delegation
    await prisma.tokenDelegation.delete({
      where: { id }
    })

    // Update voting powers
    await prisma.tokenBalance.update({
      where: { userId: delegation.delegatorId },
      data: { votingPower: { increment: amount } }
    })

    await prisma.tokenBalance.update({
      where: { userId: delegation.delegateId },
      data: { votingPower: { decrement: amount } }
    })

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

    // Get current balance
    const balance = await syncService.syncUserBalance(userId)

    // Update balance and voting power
    await prisma.tokenBalance.update({
      where: { userId },
      data: {
        balance: { increment: parsedAmount },
        votingPower: { increment: parsedAmount },
        updatedAt: new Date()
      }
    })

    // Create treasury transaction record
    await prisma.treasuryTransaction.create({
      data: {
        transactionType: 'DISTRIBUTION',
        amount: parsedAmount,
        recipientId: userId,
        description: description || 'Balance addition',
        status: 'EXECUTED'
      }
    })

    res.json({ success: true, newBalance: balance.balance.toNumber() + parsedAmount })
  } catch (error) {
    console.error('Error adding balance:', error)
    res.status(500).json({ error: 'Failed to add balance' })
  }
})

// GET /api/tokens/stats - Get token statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalSupply,
      totalDelegations,
      activeUnstakingRequests
    ] = await Promise.all([
      prisma.tokenBalance.aggregate({
        _sum: {
          balance: true,
          stakedBalance: true
        }
      }),
      prisma.tokenDelegation.count(),
      prisma.unstakingRequest.count({
        where: { status: 'PENDING' }
      })
    ])

    const totalVotingPower = await prisma.tokenBalance.aggregate({
      _sum: {
        votingPower: true
      }
    })

    res.json({
      totalSupply: (totalSupply._sum.balance?.toNumber() || 0) + (totalSupply._sum.stakedBalance?.toNumber() || 0),
      totalStaked: totalSupply._sum.stakedBalance?.toNumber() || 0,
      totalDelegations,
      activeUnstakingRequests,
      totalVotingPower: totalVotingPower._sum.votingPower?.toNumber() || 0
    })
  } catch (error) {
    console.error('Error fetching token stats:', error)
    res.status(500).json({ error: 'Failed to fetch token statistics' })
  }
})

export { router as tokenRoutes }