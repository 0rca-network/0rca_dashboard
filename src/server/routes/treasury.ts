import { Router, Request, Response } from 'express'
import { prisma } from '../../db/schema'
import { blockchainService } from '../services/blockchain'

const router = Router()

// GET /api/treasury/summary - Get treasury summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const treasuryBalance = await blockchainService.getTreasuryBalance()
    const tokenPrice = await blockchainService.getTokenPrice()
    const usdValue = treasuryBalance * tokenPrice

    // Get recent transactions
    const recentTransactions = await prisma.treasuryTransactions.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    // Calculate monthly stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyTransactions = await prisma.treasuryTransactions.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    const monthlyRevenue = monthlyTransactions
      .filter(t => t.transactionType === 'REVENUE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.transactionType === 'EXPENSE' || t.transactionType === 'GRANT')
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

    const transactions = await prisma.treasuryTransactions.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    const totalCount = await prisma.treasuryTransactions.count({ where })

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

    const proposal = await prisma.daoProposals.create({
      data: {
        creatorId: userId,
        title,
        description,
        proposalType: 'TREASURY',
        executionData: {
          requestedAmount: amount,
          treasuryAllocation: true
        },
        votingStartsAt: new Date(),
        votingEndsAt,
        status: 'ACTIVE',
        quorumRequired: 1000000
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

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

    const proposals = await prisma.daoProposals.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true
          }
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

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

    const transaction = await prisma.treasuryTransactions.create({
      data: {
        proposalId,
        transactionType: 'EXPENSE',
        amount: parsedAmount,
        recipientId,
        description,
        status: 'PENDING'
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

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

    const transaction = await prisma.treasuryTransactions.create({
      data: {
        transactionType: 'REVENUE',
        amount: parsedAmount,
        description,
        status: 'EXECUTED'
      }
    })

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

    await prisma.tokenBalances.update({
      where: { userId: recipientId },
      data: {
        balance: { increment: parsedAmount },
        votingPower: { increment: parsedAmount },
        updatedAt: new Date()
      }
    })

    // Create treasury transaction
    const transaction = await prisma.treasuryTransactions.create({
      data: {
        transactionType: 'DISTRIBUTION',
        amount: parsedAmount,
        recipientId,
        description,
        status: 'EXECUTED'
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

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
      .filter(t => t.transactionType === 'EXPENSE' || t.transactionType === 'GRANT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyRevenue = monthlyTransactions
      .filter(t => t.transactionType === 'REVENUE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const quarterlyExpenses = quarterlyTransactions
      .filter(t => t.transactionType === 'EXPENSE' || t.transactionType === 'GRANT')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const quarterlyRevenue = quarterlyTransactions
      .filter(t => t.transactionType === 'REVENUE')
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