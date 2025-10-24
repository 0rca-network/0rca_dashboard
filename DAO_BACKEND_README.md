# Orca Network DAO Backend Service

A comprehensive backend service layer for the Orca Network DAO, providing secure API endpoints, blockchain integration, and real-time data synchronization.

## 🚀 Features

- **Governance Module**: Complete proposal and voting system
- **Token Management**: Staking, rewards, and delegation functionality
- **Treasury Management**: Financial tracking and funding proposals
- **Blockchain Integration**: Solana Web3 integration for secure transactions
- **Real-time Sync**: Automated data synchronization with blockchain state
- **Background Workers**: Automated rewards calculation and distribution
- **Security**: JWT authentication and comprehensive input validation

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Solana RPC endpoint
- npm or yarn package manager

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/orca_dao"

   # Solana Configuration
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   GOVERNANCE_PROGRAM_ID="your-governance-program-id"
   STAKING_PROGRAM_ID="your-staking-program-id"
   TREASURY_ACCOUNTS="treasury-account-1,treasury-account-2"

   # Server Configuration
   PORT=3001
   JWT_SECRET="your-jwt-secret-key"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # (Optional) Open Prisma Studio
   npm run db:studio
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start the API server
npm run api:dev

# Start the rewards worker (in another terminal)
npm run worker:rewards

# Start the frontend (in another terminal)
npm run dev
```

### Production Mode
```bash
# Build the application
npm run api:build

# Start the API server
npm run api:start
```

## 📚 API Documentation

### Authentication
All protected endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Governance Endpoints

#### Get All Proposals
```http
GET /api/governance/proposals
Query Parameters:
- status: ACTIVE | PASSED | FAILED | EXECUTED
- type: FEE_CHANGE | TREASURY | FEATURE | AGENT_CURATION | OTHER
```

#### Get Single Proposal
```http
GET /api/governance/proposals/:id
```

#### Create Proposal
```http
POST /api/governance/proposals
Body:
{
  "title": "Proposal Title",
  "description": "Detailed description",
  "proposalType": "TREASURY",
  "userId": "user-id"
}
```

#### Cast Vote
```http
POST /api/governance/vote
Body:
{
  "proposalId": "proposal-id",
  "voterId": "user-id",
  "voteType": "FOR" | "AGAINST" | "ABSTAIN"
}
```

### Token Management Endpoints

#### Get Token Balance
```http
GET /api/tokens/balance/:userId
```

#### Stake Tokens
```http
POST /api/tokens/stake
Body:
{
  "userId": "user-id",
  "amount": 1000
}
```

#### Unstake Tokens
```http
POST /api/tokens/unstake
Body:
{
  "userId": "user-id",
  "amount": 500
}
```

#### Delegate Voting Power
```http
POST /api/tokens/delegate
Body:
{
  "delegatorId": "delegator-id",
  "delegateId": "delegate-id",
  "amount": 1000
}
```

#### Claim Rewards
```http
POST /api/tokens/claim-rewards
Body:
{
  "userId": "user-id"
}
```

### Treasury Endpoints

#### Get Treasury Summary
```http
GET /api/treasury/summary
```

#### Get Treasury Transactions
```http
GET /api/treasury/transactions
Query Parameters:
- type: REVENUE | DISTRIBUTION | GRANT | EXPENSE
- limit: number (default 50)
- offset: number (default 0)
```

#### Create Funding Proposal
```http
POST /api/treasury/funding-proposal
Body:
{
  "userId": "user-id",
  "title": "Project Title",
  "description": "Project description",
  "requestedAmount": 50000
}
```

#### Record Treasury Expense
```http
POST /api/treasury/expense
Body:
{
  "proposalId": "proposal-id",
  "amount": 10000,
  "description": "Development costs",
  "recipientId": "recipient-id"
}
```

## 🔄 Background Services

### Rewards Worker
Automatically calculates and distributes staking rewards (8% APY) daily at midnight.

**Manual Run:**
```bash
npm run worker:rewards
```

### Sync Services
- **Proposal Sync**: Updates proposal statuses every 60 seconds
- **Treasury Sync**: Syncs treasury balances every 30 seconds
- **Token Balance Sync**: Updates voting power calculations every 120 seconds

## 🔐 Security Features

### Row Level Security (RLS)
All database tables implement RLS policies:
- Users can only access their own token balances and staking data
- Proposal creation requires minimum voting power (10,000)
- Treasury operations require proper authorization

### Input Validation
All API endpoints use Zod schemas for comprehensive input validation and sanitization.

### Rate Limiting
Consider implementing rate limiting for production deployment:
```typescript
// Example implementation
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}))
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
JWT_SECRET="your-production-jwt-secret"
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run api:build
EXPOSE 3001
CMD ["npm", "run", "api:start"]
```

### PM2 Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Monitor the application
pm2 monit
```

## 📊 Monitoring & Logging

### Health Check
```http
GET /health
```

### Metrics Collection
The application exposes Prometheus metrics at `/metrics` endpoint.

### Error Logging
All errors are logged with structured JSON format for easy parsing and alerting.

## 🔧 Configuration

### Blockchain Configuration
Update the following environment variables for your specific Solana programs:

```env
GOVERNANCE_PROGRAM_ID="your-governance-program-id"
STAKING_PROGRAM_ID="your-staking-program-id"
TREASURY_ACCOUNTS="treasury-account-1,treasury-account-2"
```

### Database Configuration
For Supabase integration:
```env
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true&connection_limit=1"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section in the wiki
- Review the API documentation

## 🔄 Migration from Existing Setup

If migrating from the existing frontend-only setup:

1. **Backup existing data** from Supabase
2. **Run database migrations** to add new DAO tables
3. **Update frontend** to use new API endpoints
4. **Configure environment variables** for blockchain integration
5. **Test thoroughly** in staging environment

## 📈 Performance Considerations

- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Connection Pooling**: Use connection pooling for database connections
- **Caching**: Implement Redis caching for frequently accessed data
- **Rate Limiting**: Implement appropriate rate limits for API endpoints
- **Monitoring**: Set up monitoring and alerting for critical services

## 🔮 Future Enhancements

- [ ] Multi-signature treasury operations
- [ ] Advanced governance mechanisms (quadratic voting)
- [ ] Cross-chain token support
- [ ] Advanced analytics and reporting
- [ ] Mobile API endpoints
- [ ] Webhook integrations for external services