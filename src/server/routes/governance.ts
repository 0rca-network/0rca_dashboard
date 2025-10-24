import { Router, Request, Response } from 'express'
import { prisma } from '../index'
import { blockchainService } from '../services/blockchain'
import { syncService } from '../services/sync-service'

const router = Router()

// GET /api/governance/proposals - Get all proposals
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query

    const where: any = {}
    if (status) where.status = status
    if (type) where.proposalType = type

    const proposals = await prisma.daoProposal.findMany({
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
    console.error('Error fetching proposals:', error)
    res.status(500).json({ error: 'Failed to fetch proposals' })
  }
})

// GET /api/governance/proposals/:id - Get single proposal
router.get('/proposals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const proposal = await prisma.daoProposal.findUnique({
      where: { id },
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
      }
    })

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    res.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    res.status(500).json({ error: 'Failed to fetch proposal' })
  }
})

// POST /api/governance/proposals - Create new proposal
router.post('/proposals', async (req: Request, res: Response) => {
  try {
    const { title, description, proposalType, userId } = req.body

    if (!title || !description || !proposalType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user has enough voting power
    const tokenBalance = await syncService.syncUserBalance(userId)
    if (tokenBalance.votingPower.toNumber() < 100) {
      return res.status(403).json({ error: 'Insufficient voting power to create proposal' })
    }

    const votingEndsAt = new Date()
    votingEndsAt.setDate(votingEndsAt.getDate() + 7)

    const proposal = await prisma.daoProposal.create({
      data: {
        creatorId: userId,
        title,
        description,
        proposalType,
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

    // Create blockchain transaction for proposal
    const transaction = await blockchainService.createProposalTransaction(
      userId,
      title,
      description,
      proposalType,
      votingEndsAt
    )

    res.json({
      proposal,
      transaction
    })
  } catch (error) {
    console.error('Error creating proposal:', error)
    res.status(500).json({ error: 'Failed to create proposal' })
  }
})

// POST /api/governance/vote - Cast a vote
router.post('/vote', async (req: Request, res: Response) => {
  try {
    const { proposalId, voterId, voteType } = req.body

    if (!proposalId || !voterId || !voteType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if proposal is still active
    const proposal = await prisma.daoProposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal || proposal.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Proposal is not active' })
    }

    if (new Date() > proposal.votingEndsAt) {
      return res.status(400).json({ error: 'Voting period has ended' })
    }

    // Check if user already voted
    const existingVote = await prisma.daoVote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId,
          voterId
        }
      }
    })

    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted on this proposal' })
    }

    // Get user's voting power
    const tokenBalance = await syncService.syncUserBalance(voterId)

    // Create vote record
    const vote = await prisma.daoVote.create({
      data: {
        proposalId,
        voterId,
        voteType,
        votingPower: tokenBalance.votingPower
      }
    })

    // Update proposal vote counts
    const updateData: any = {}
    switch (voteType) {
      case 'FOR':
        updateData.votesFor = { increment: tokenBalance.votingPower }
        break
      case 'AGAINST':
        updateData.votesAgainst = { increment: tokenBalance.votingPower }
        break
      case 'ABSTAIN':
        updateData.votesAbstain = { increment: tokenBalance.votingPower }
        break
    }

    await prisma.daoProposal.update({
      where: { id: proposalId },
      data: updateData
    })

    // Create blockchain transaction for vote
    const transaction = await blockchainService.createVoteTransaction(
      voterId,
      proposalId,
      voteType
    )

    res.json({
      vote,
      transaction
    })
  } catch (error) {
    console.error('Error casting vote:', error)
    res.status(500).json({ error: 'Failed to cast vote' })
  }
})

// GET /api/governance/stats - Get governance statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalProposals,
      activeProposals,
      totalVotes,
      uniqueVoters
    ] = await Promise.all([
      prisma.daoProposal.count(),
      prisma.daoProposal.count({ where: { status: 'ACTIVE' } }),
      prisma.daoVote.count(),
      prisma.daoVote.groupBy({
        by: ['voterId'],
        _count: true
      })
    ])

    res.json({
      totalProposals,
      activeProposals,
      totalVotes,
      uniqueVoters: uniqueVoters.length
    })
  } catch (error) {
    console.error('Error fetching governance stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export { router as governanceRoutes }