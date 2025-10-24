import { PrismaClient } from '@prisma/client'

// Create a separate Prisma instance for tests
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

beforeAll(async () => {
  // Connect to test database
  await testPrisma.$connect()
})

afterAll(async () => {
  // Clean up and disconnect
  await testPrisma.$disconnect()
})

beforeEach(async () => {
  // Clear all data before each test
  const tables = [
    'dao_votes',
    'dao_proposals',
    'token_balances',
    'profiles',
    'treasury_transactions',
    'token_delegations',
    'unstaking_requests'
  ]

  for (const table of tables) {
    try {
      await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE`)
    } catch (error) {
      // Table might not exist in test environment
      console.warn(`Warning: Could not truncate table ${table}`)
    }
  }
})

// Export test Prisma instance
export { testPrisma as prisma }