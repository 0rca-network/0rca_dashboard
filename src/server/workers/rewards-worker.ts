import { prisma } from '../../db/schema'

export class RewardsWorker {
  private interval: NodeJS.Timeout | null = null

  start() {
    console.log('💰 Starting rewards worker...')

    // Calculate rewards daily at midnight
    this.scheduleDailyRewardCalculation()

    // Run initial calculation
    this.calculateRewards()
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private scheduleDailyRewardCalculation() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // Schedule first run at midnight
    setTimeout(() => {
      this.calculateRewards()

      // Then run every 24 hours
      this.interval = setInterval(() => {
        this.calculateRewards()
      }, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }

  private async calculateRewards() {
    try {
      console.log('🧮 Calculating staking rewards...')

      const stakedBalances = await prisma.tokenBalances.findMany({
        where: {
          stakedBalance: {
            gt: 0
          }
        }
      })

      const apy = 0.08 // 8% APY
      const dailyRewardRate = apy / 365

      for (const balance of stakedBalances) {
        const dailyReward = balance.stakedBalance.toNumber() * dailyRewardRate

        // Update the balance with accrued rewards
        await prisma.tokenBalances.update({
          where: { id: balance.id },
          data: {
            balance: {
              increment: dailyReward
            },
            updatedAt: new Date()
          }
        })

        console.log(`💰 User ${balance.userId}: +${dailyReward.toFixed(8)} ORCA rewards`)
      }

      console.log(`✅ Rewards calculated for ${stakedBalances.length} users`)

    } catch (error) {
      console.error('Error calculating rewards:', error)
    }
  }

  async calculateRewardsForUser(userId: string) {
    try {
      const balance = await prisma.tokenBalances.findUnique({
        where: { userId }
      })

      if (!balance || balance.stakedBalance.toNumber() <= 0) {
        return 0
      }

      const apy = 0.08 // 8% APY
      const dailyRewardRate = apy / 365
      const dailyReward = balance.stakedBalance.toNumber() * dailyRewardRate

      // Update the balance with accrued rewards
      await prisma.tokenBalances.update({
        where: { id: balance.id },
        data: {
          balance: {
            increment: dailyReward
          },
          updatedAt: new Date()
        }
      })

      return dailyReward

    } catch (error) {
      console.error('Error calculating rewards for user:', error)
      return 0
    }
  }
}

export const rewardsWorker = new RewardsWorker()