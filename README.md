# Orca Network Dashboard

A complete, production-ready, full-stack AI Agent Network Dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

### 🏗️ Architecture
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for backend (PostgreSQL, Auth, Realtime)
- **Shadcn/UI** components
- **Recharts** for data visualization

### 👥 User Roles
- **Creators**: Manage AI agents, track earnings, view analytics
- **Users**: Execute tasks, manage wallet, discover agents

### 🎯 Core Features

#### For Creators
- **Agent Management**: Create, configure, and monitor AI agents
- **Performance Analytics**: Track success rates, response times, revenue
- **Earnings Dashboard**: Revenue breakdown, transaction history
- **Agent Settings**: Pricing, API endpoints, rate limiting

#### For Users
- **Orchestrator Console**: Execute complex tasks with AI agent compositions
- **Execution History**: Track all past executions with detailed breakdowns
- **Agent Discovery**: Browse and filter available agents
- **Wallet Management**: Balance tracking, budget limits, spending analytics

#### Shared Features
- **Dashboard Overview**: Role-specific metrics and activity feeds
- **Notifications**: Real-time alerts and system messages
- **Settings**: Profile management, preferences, security
- **Dark Mode**: Toggle between light and dark themes

## Database Schema

### Tables
- `profiles`: User profiles with roles and wallet information
- `agents`: AI agent definitions and configurations
- `executions`: Task execution records and results
- `earnings`: Revenue tracking for creators
- `transactions`: Financial transaction history

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd orca-network-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase database**
   
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Enable RLS
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     role TEXT CHECK (role IN ('creator', 'user')) NOT NULL DEFAULT 'user',
     wallet_balance DECIMAL(10,2) DEFAULT 100.00,
     monthly_budget DECIMAL(10,2),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create agents table
   CREATE TABLE agents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     creator_id UUID REFERENCES profiles(id) NOT NULL,
     name TEXT NOT NULL,
     description TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'active',
     category TEXT NOT NULL,
     pricing_type TEXT NOT NULL,
     price_details JSONB NOT NULL,
     api_endpoint TEXT NOT NULL,
     max_concurrent_requests INTEGER DEFAULT 10,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create executions table
   CREATE TABLE executions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES profiles(id) NOT NULL,
     agent_id UUID REFERENCES agents(id) NOT NULL,
     goal TEXT NOT NULL,
     status TEXT NOT NULL,
     token_cost INTEGER NOT NULL,
     total_cost DECIMAL(10,2) NOT NULL,
     time_taken_ms INTEGER NOT NULL,
     results JSONB,
     decision_hashes JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create earnings table
   CREATE TABLE earnings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     agent_id UUID REFERENCES agents(id) NOT NULL,
     revenue_amount DECIMAL(10,2) NOT NULL,
     platform_fee DECIMAL(10,2) NOT NULL,
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create transactions table
   CREATE TABLE transactions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES profiles(id) NOT NULL,
     type TEXT NOT NULL,
     amount DECIMAL(10,2) NOT NULL,
     details JSONB,
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- RLS Policies
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

   -- Profiles policies
   CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

   -- Agents policies
   CREATE POLICY "Anyone can view active agents" ON agents FOR SELECT USING (status = 'active');
   CREATE POLICY "Creators can manage own agents" ON agents FOR ALL USING (auth.uid() = creator_id);

   -- Executions policies
   CREATE POLICY "Users can view own executions" ON executions FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can create executions" ON executions FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Earnings policies
   CREATE POLICY "Creators can view earnings for own agents" ON earnings FOR SELECT USING (
     agent_id IN (SELECT id FROM agents WHERE creator_id = auth.uid())
   );

   -- Transactions policies
   CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Function to create profile on signup
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, role, wallet_balance)
     VALUES (NEW.id, 'user', 100.00);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Trigger for new user signup
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Usage

### First Time Setup

1. **Sign up** for an account at `/auth/login`
2. **Choose your role** (Creator or User) in Settings
3. **For Creators**: Create your first agent in "My Agents"
4. **For Users**: Add funds to your wallet and try the Orchestrator

### Key Workflows

#### As a Creator
1. Create agents with pricing and API endpoints
2. Monitor performance in Analytics
3. Track earnings and manage payouts
4. Configure agent settings and rate limits

#### As a User
1. Discover agents in the marketplace
2. Execute tasks using the Orchestrator
3. Monitor execution history and costs
4. Manage wallet balance and budgets

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.