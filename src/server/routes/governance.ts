import { Router, Request, Response } from 'express'
import { createClient } from '@/lib/supabase/server'
import { blockchainService } from '../services/blockchain'
import { syncService } from '../services/sync-service'

const router = Router()

// GET /api/governance/proposals - Get all proposals
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query

    const supabase = createClient()

    let query = supabase
      .from('dao_proposals')
      .select(`
        *,
        creator:profiles(id, email),
        votes:dao_votes(*, voter:profiles(id, email))
      `)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('proposal_type', type)

    const { data: proposals, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch proposals' })
    }

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

    const supabase = createClient()

    const { data: proposal, error } = await supabase
      .from('dao_proposals')
      .select(`
        *,
        creator:profiles(id, email),
        votes:dao_votes(*, voter:profiles(id, email))
      `)
      .eq('id', id)
      .single()

    if (error || !proposal) {
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

    const supabase = createClient()

    const { data: proposal, error } = await supabase
      .from('dao_proposals')
      .insert({
        creator_id: userId,
        title,
        description,
        proposal_type: proposalType,
        voting_starts_at: new Date().toISOString(),
        voting_ends_at: votingEndsAt.toISOString(),
        status: 'ACTIVE',
        quorum_required: 1000000
      })
      .select(`
        *,
        creator:profiles(id, email)
      `)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create proposal' })
    }

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
    const supabase = createClient()

    const { data: proposal, error: proposalError } = await supabase
      .from('dao_proposals')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal || proposal.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Proposal is not active' })
    }

    if (new Date() > new Date(proposal.voting_ends_at)) {
      return res.status(400).json({ error: 'Voting period has ended' })
    }

    // Check if user already voted
    const { data: existingVote, error: voteError } = await supabase
      .from('dao_votes')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('voter_id', voterId)
      .single()

    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted on this proposal' })
    }

    // Get user's voting power
    const tokenBalance = await syncService.syncUserBalance(voterId)

    // Create vote record
    const { data: vote, error: createVoteError } = await supabase
      .from('dao_votes')
      .insert({
        proposal_id: proposalId,
        voter_id: voterId,
        vote_type: voteType,
        voting_power: tokenBalance.votingPower
      })
      .select()
      .single()

    if (createVoteError) {
      return res.status(500).json({ error: 'Failed to cast vote' })
    }

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

    const { error: updateError } = await supabase
      .from('dao_proposals')
      .update(updateData)
      .eq('id', proposalId)

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update proposal' })
    }

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
    const supabase = createClient()

    const [
      totalProposalsResult,
      activeProposalsResult,
      totalVotesResult,
      uniqueVotersResult
    ] = await Promise.all([
      supabase.from('dao_proposals').select('*', { count: 'exact', head: true }),
      supabase.from('dao_proposals').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('dao_votes').select('*', { count: 'exact', head: true }),
      supabase.from('dao_votes').select('voter_id')
    ])

    const totalProposals = totalProposalsResult.count || 0
    const activeProposals = activeProposalsResult.count || 0
    const totalVotes = totalVotesResult.count || 0
    const uniqueVoters = uniqueVotersResult.data ? new Set(uniqueVotersResult.data.map((v: any) => v.voter_id)).size : 0

    res.json({
      totalProposals,
      activeProposals,
      totalVotes,
      uniqueVoters
    })
  } catch (error) {
    console.error('Error fetching governance stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export { router as governanceRoutes }