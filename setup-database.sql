-- Complete Database Setup for Orca Network
-- Run this in your Supabase SQL editor or PostgreSQL client

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

-- Create token_balances table
CREATE TABLE token_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  balance DECIMAL(18,8) DEFAULT 0,
  staked_balance DECIMAL(18,8) DEFAULT 0,
  voting_power DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dao_proposals table
CREATE TABLE dao_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('fee_change', 'treasury', 'feature', 'agent_curation', 'other')),
  execution_data JSONB,
  voting_starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed', 'executed')),
  votes_for DECIMAL(18,8) DEFAULT 0,
  votes_against DECIMAL(18,8) DEFAULT 0,
  votes_abstain DECIMAL(18,8) DEFAULT 0,
  quorum_required DECIMAL(18,8) DEFAULT 1000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dao_votes table
CREATE TABLE dao_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES dao_proposals(id) NOT NULL,
  voter_id UUID REFERENCES profiles(id) NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
  voting_power DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- Create dao_treasury table
CREATE TABLE dao_treasury (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES dao_proposals(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('revenue', 'distribution', 'grant', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_delegations table
CREATE TABLE token_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID REFERENCES profiles(id) NOT NULL,
  delegate_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id)
);

-- Create unstaking_requests table
CREATE TABLE unstaking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create chat_sessions table
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unstaking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (from supabase-schema.sql and dao-schema.sql)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own token balance" ON token_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own token balance" ON token_balances FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active proposals" ON dao_proposals FOR SELECT USING (true);
CREATE POLICY "Token holders can create proposals" ON dao_proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Anyone can view votes" ON dao_votes FOR SELECT USING (true);
CREATE POLICY "Users can cast own votes" ON dao_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Anyone can view treasury" ON dao_treasury FOR SELECT USING (true);

CREATE POLICY "Users can view own delegations" ON token_delegations FOR SELECT USING (auth.uid() = delegator_id OR auth.uid() = delegate_id);
CREATE POLICY "Users can create delegations" ON token_delegations FOR INSERT WITH CHECK (auth.uid() = delegator_id);

CREATE POLICY "Users can view own unstaking requests" ON unstaking_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create unstaking requests" ON unstaking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unstaking requests" ON unstaking_requests FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active agents" ON agents FOR SELECT USING (status = 'active');
CREATE POLICY "Creators can manage own agents" ON agents FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own executions" ON executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create executions" ON executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own executions" ON executions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Creators can view earnings for own agents" ON earnings FOR SELECT USING (agent_id IN (SELECT id FROM agents WHERE creator_id = auth.uid()));
CREATE POLICY "System can create earnings" ON earnings FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from own sessions" ON chat_messages FOR SELECT USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can create messages in own sessions" ON chat_messages FOR INSERT WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete messages from own sessions" ON chat_messages FOR DELETE USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_agents_creator_id ON agents(creator_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_agent_id ON executions(agent_id);
CREATE INDEX idx_executions_created_at ON executions(created_at);
CREATE INDEX idx_earnings_agent_id ON earnings(agent_id);
CREATE INDEX idx_earnings_timestamp ON earnings(timestamp);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Sample Data
-- Insert sample profiles (assuming you have auth.users, or adjust accordingly)
-- For testing, insert directly into profiles with dummy IDs
INSERT INTO profiles (id, role, wallet_balance) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'user', 1000.00),
  ('550e8400-e29b-41d4-a716-446655440001', 'creator', 500.00);

-- Initialize token balances for sample users
INSERT INTO token_balances (user_id, balance, voting_power) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 1000.0, 1000.0),
  ('550e8400-e29b-41d4-a716-446655440001', 500.0, 500.0);

-- Sample proposals
INSERT INTO dao_proposals (id, creator_id, title, description, proposal_type, voting_starts_at, voting_ends_at, status, votes_for, votes_against, votes_abstain, quorum_required) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'Reduce Platform Fee from 10% to 8%', 'Proposal to reduce the platform fee charged to creators from 10% to 8% to increase competitiveness and attract more agent creators to the platform.', 'fee_change', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'active', 750000, 250000, 50000, 1000000),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'Allocate $500K for Agent Creator Incentives', 'Allocate $500,000 from treasury to create an incentive program for high-performing agent creators, including performance bonuses and development grants.', 'treasury', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'active', 1200000, 300000, 100000, 1000000);

-- Sample treasury transactions
INSERT INTO dao_treasury (transaction_type, amount, description, status) VALUES
  ('revenue', 125000.00, 'Monthly platform fees collected', 'executed'),
  ('expense', 45000.00, 'Development team salaries', 'executed'),
  ('distribution', 25000.00, 'Token holder rewards distribution', 'executed');

-- Sample agents
INSERT INTO agents (creator_id, name, description, category, pricing_type, price_details, api_endpoint) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'NLP Text Analyzer', 'Advanced natural language processing for sentiment analysis', 'NLP', 'per_token', '{"per_token": 0.001}', 'https://api.example.com/nlp');

-- Sample executions
INSERT INTO executions (user_id, agent_id, goal, status, token_cost, total_cost, time_taken_ms, results) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM agents LIMIT 1), 'Analyze customer feedback sentiment', 'completed', 1250, 8.75, 3200, '{"summary": "Analysis completed", "sentiment": "positive"}');

-- Sample earnings
INSERT INTO earnings (agent_id, revenue_amount, platform_fee) VALUES
  ((SELECT id FROM agents LIMIT 1), 10.00, 1.00);

-- Sample transactions
INSERT INTO transactions (user_id, type, amount, details) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'purchase', 50.00, '{"item": "tokens"}');

-- Sample chat sessions and messages
INSERT INTO chat_sessions (user_id, title) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'AI Assistant Session 1');

INSERT INTO chat_messages (session_id, content, is_user) VALUES
  ((SELECT id FROM chat_sessions LIMIT 1), 'Hello, how can I help?', false),
  ((SELECT id FROM chat_sessions LIMIT 1), 'What is the weather?', true);