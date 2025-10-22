-- DAO Database Schema for Orca Network

-- ORCA Token balances and staking
CREATE TABLE token_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  balance DECIMAL(18,8) DEFAULT 0,
  staked_balance DECIMAL(18,8) DEFAULT 0,
  voting_power DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DAO Proposals
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

-- Individual votes
CREATE TABLE dao_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES dao_proposals(id) NOT NULL,
  voter_id UUID REFERENCES profiles(id) NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
  voting_power DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- Treasury transactions
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

-- Token delegations
CREATE TABLE token_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID REFERENCES profiles(id) NOT NULL,
  delegate_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id)
);

-- RLS Policies
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_delegations ENABLE ROW LEVEL SECURITY;

-- Token balances policies
CREATE POLICY "Users can view own token balance" ON token_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own token balance" ON token_balances FOR UPDATE USING (auth.uid() = user_id);

-- Proposals policies
CREATE POLICY "Anyone can view active proposals" ON dao_proposals FOR SELECT USING (true);
CREATE POLICY "Token holders can create proposals" ON dao_proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON dao_votes FOR SELECT USING (true);
CREATE POLICY "Users can cast own votes" ON dao_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Treasury policies
CREATE POLICY "Anyone can view treasury" ON dao_treasury FOR SELECT USING (true);

-- Token unstaking requests
CREATE TABLE unstaking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delegations policies
CREATE POLICY "Users can view own delegations" ON token_delegations FOR SELECT USING (auth.uid() = delegator_id OR auth.uid() = delegate_id);
CREATE POLICY "Users can create delegations" ON token_delegations FOR INSERT WITH CHECK (auth.uid() = delegator_id);

-- Unstaking requests policies
ALTER TABLE unstaking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own unstaking requests" ON unstaking_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create unstaking requests" ON unstaking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unstaking requests" ON unstaking_requests FOR UPDATE USING (auth.uid() = user_id);

-- Initialize token balances for existing users
INSERT INTO token_balances (user_id, balance, voting_power)
SELECT id, 1000.0, 1000.0 FROM profiles
ON CONFLICT DO NOTHING;