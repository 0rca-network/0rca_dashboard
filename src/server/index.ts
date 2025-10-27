import express from 'express'
import cors from 'cors'
import { prisma } from '../db/schema'
import { governanceRoutes } from './routes/governance'
import { tokenRoutes } from './routes/tokens'
import { treasuryRoutes } from './routes/treasury'
import { blockchainService } from './services/blockchain'
import { rewardsWorker } from './workers/rewards-worker'
import { syncService } from './services/sync-service'

const app = express()
const port = process.env.PORT || 3001

// Initialize Prisma
export const db = prisma

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/governance', governanceRoutes)
app.use('/api/tokens', tokenRoutes)
app.use('/api/treasury', treasuryRoutes)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

async function startServer() {
  try {
    // Initialize blockchain service
    await blockchainService.initialize()

    // Start background workers
    rewardsWorker.start()

    // Start sync services
    syncService.start()

    // Start server
    app.listen(port, () => {
      console.log(`🚀 Orca DAO API Server running on port ${port}`)
      console.log(`📊 Health check: http://localhost:${port}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()