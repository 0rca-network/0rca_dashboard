import request from 'supertest'
import express from 'express'
import { governanceRoutes } from '../routes/governance'
import { prisma } from '../index'

const app = express()
app.use(express.json())
app.use('/api/governance', governanceRoutes)

describe('Governance API', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.daoVote.deleteMany()
    await prisma.daoProposal.deleteMany()
    await prisma.tokenBalance.deleteMany()
    await prisma.profile.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/governance/proposals', () => {
    it('should return all proposals', async () => {
      // Create test user and proposal
      const user = await prisma.profile.create({
        data: {
          email: 'test@example.com',
          role: 'USER'
        }
      })

      const tokenBalance = await prisma.tokenBalance.create({
        data: {
          userId: user.id,
          balance: 1000,
          votingPower: 1000
        }
      })

      const proposal = await prisma.daoProposal.create({
        data: {
          creatorId: user.id,
          title: 'Test Proposal',
          description: 'Test Description',
          proposalType: 'FEATURE',
          votingStartsAt: new Date(),
          votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      })

      const response = await request(app)
        .get('/api/governance/proposals')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].title).toBe('Test Proposal')
    })
  })

  describe('POST /api/governance/proposals', () => {
    it('should create a new proposal', async () => {
      const user = await prisma.profile.create({
        data: {
          email: 'creator@example.com',
          role: 'USER'
        }
      })

      const tokenBalance = await prisma.tokenBalance.create({
        data: {
          userId: user.id,
          balance: 1000,
          votingPower: 1000 // Above minimum requirement
        }
      })

      const response = await request(app)
        .post('/api/governance/proposals')
        .send({
          title: 'New Feature Proposal',
          description: 'Implement new feature',
          proposalType: 'FEATURE',
          userId: user.id
        })
        .expect(200)

      expect(response.body.proposal.title).toBe('New Feature Proposal')
      expect(response.body.transaction).toBeDefined()
    })

    it('should reject proposal with insufficient voting power', async () => {
      const user = await prisma.profile.create({
        data: {
          email: 'low-power@example.com',
          role: 'USER'
        }
      })

      await prisma.tokenBalance.create({
        data: {
          userId: user.id,
          balance: 1000,
          votingPower: 50 // Below minimum requirement
        }
      })

      await request(app)
        .post('/api/governance/proposals')
        .send({
          title: 'Low Power Proposal',
          description: 'Should be rejected',
          proposalType: 'FEATURE',
          userId: user.id
        })
        .expect(403)
    })
  })

  describe('POST /api/governance/vote', () => {
    it('should cast a vote successfully', async () => {
      const voter = await prisma.profile.create({
        data: {
          email: 'voter@example.com',
          role: 'USER'
        }
      })

      const tokenBalance = await prisma.tokenBalance.create({
        data: {
          userId: voter.id,
          balance: 1000,
          votingPower: 1000
        }
      })

      const proposal = await prisma.daoProposal.create({
        data: {
          creatorId: voter.id,
          title: 'Voting Test',
          description: 'Test voting',
          proposalType: 'FEATURE',
          votingStartsAt: new Date(),
          votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      })

      const response = await request(app)
        .post('/api/governance/vote')
        .send({
          proposalId: proposal.id,
          voterId: voter.id,
          voteType: 'FOR'
        })
        .expect(200)

      expect(response.body.vote.voteType).toBe('FOR')
      expect(response.body.transaction).toBeDefined()
    })
  })
})