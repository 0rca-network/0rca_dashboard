import { blockchainService } from './blockchain'
import { db } from '../index'
import { tokenBalances, daoProposals, daoVotes, treasuryTransactions, tokenDelegations, unstakingRequests } from '../../db/schema'
import { and, eq, lt } from 'drizzle-orm'

export class SyncService {
  private intervals: NodeJS.Timeout[] = []

  start() {
    console.log('🚀 Starting sync services...')

    // Sync proposal data every 60 seconds
    this.intervals.push(setInterval(() => {
      this.syncProposalData()
    }, 60000))

    // Sync treasury data every 30 seconds
    this.intervals.push(setInterval(() => {
      this.syncTreasuryData()
    }, 30000))

    // Sync token balances every 120 seconds
    this.intervals.push(setInterval(() => {
      this.syncTokenBalances()
    }, 120000))
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }

  private async syncProposalData() {
    try {
      console.log('🔄 Syncing proposal data...')

      // This would fetch proposal data from the blockchain
      // For now, we'll simulate with mock data
      await blockchainService.syncProposalData()

      // Update proposal statuses based on voting end times
      const expiredProposals = await db.query.daoProposals.findMany({
        where: and(eq(daoProposals.status, 'ACTIVE'), lt(daoProposals.votingEndsAt, new Date()))
      })

      for (const proposal of expiredProposals) {
        const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain)

        let newStatus: 'PASSED' | 'FAILED'
        if (totalVotes >= Number(proposal.quorumRequired) && Number(proposal.votesFor) > Number(proposal.votesAgainst)) {
          newStatus = 'PASSED'
        } else {
          newStatus = 'FAILED'
        }

        await db.update(daoProposals).set({ status: newStatus }).where(eq(daoProposals.id, proposal.id))

        console.log(`📊 Proposal ${proposal.id} status updated to ${newStatus}`)
      }

    } catch (error) {
      console.error('Error syncing proposal data:', error)
    }
  }

  private async syncTreasuryData() {
    try {
      console.log('🔄 Syncing treasury data...')

      const treasuryBalance = await blockchainService.getTreasuryBalance()
      const tokenPrice = await blockchainService.getTokenPrice()
      const usdValue = treasuryBalance * tokenPrice

      // Log treasury transaction (mock data for now)
      await db.insert(treasuryTransactions).values({
        transactionType: 'REVENUE',
        amount: usdValue.toString(),
        description: 'Treasury balance sync',
        status: 'EXECUTED'
      })

      await blockchainService.syncTreasuryData()

    } catch (error) {
      console.error('Error syncing treasury data:', error)
    }
  }

  private async syncTokenBalances() {
    try {
      console.log('🔄 Syncing token balances...')

      // This would sync token balances from the blockchain
      // For now, we'll update voting power based on staking and delegations

      const allBalances = await db.query.tokenBalances.findMany()

      for (const balance of allBalances) {
        const receivedDelegations = await db.query.tokenDelegations.findMany({
          where: eq(tokenDelegations.delegateId, balance.userId)
        })
        const givenDelegations = await db.query.tokenDelegations.findMany({
          where: eq(tokenDelegations.delegatorId, balance.userId)
        })

        const receivedSum = receivedDelegations.reduce((sum: number, d) => sum + Number(d.amount), 0)
        const givenSum = givenDelegations.reduce((sum: number, d) => sum + Number(d.amount), 0)
        const newVotingPower = Number(balance.balance) + (Number(balance.stakedBalance) * 1.5) + receivedSum - givenSum

        await db.update(tokenBalances).set({
          votingPower: newVotingPower.toString(),
          updatedAt: new Date()
        }).where(eq(tokenBalances.id, balance.id))
      }

    } catch (error) {
      console.error('Error syncing token balances:', error)
    }
  }

  async syncUserBalance(userId: string) {
    try {
      // This would fetch the user's token balance from the blockchain
      // For now, we'll initialize with default values if not exists

      let balance = await db.query.tokenBalances.findFirst({
        where: eq(tokenBalances.userId, userId)
      })

      if (!balance) {
        balance = await db.insert(tokenBalances).values({
          userId,
          balance: '1000',
          stakedBalance: '0',
          votingPower: '1000'
        }).returning().then(res => res[0])
      } else if (Number(balance.votingPower) === 0) {
        // Boost zero voting power to minimum required
        balance = await db.update(tokenBalances).set({
          balance: '1000',
          votingPower: '1000',
          updatedAt: new Date()
        }).where(eq(tokenBalances.userId, userId)).returning().then(res => res[0])
      }

      return balance

    } catch (error) {
      console.error('Error syncing user balance:', error)
      throw error
    }
  }
}

export const syncService = new SyncService()