# Database Setup Instructions

## 1. Go to your Supabase project dashboard
Visit: https://supabase.com/dashboard/project/kkuzsmeykwseierdeagd

## 2. Navigate to SQL Editor
Click on "SQL Editor" in the left sidebar

## 3. Run the following SQL commands:

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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view active agents" ON agents FOR SELECT USING (status = 'active');
CREATE POLICY "Creators can manage own agents" ON agents FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own executions" ON executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create executions" ON executions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view earnings for own agents" ON earnings FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE creator_id = auth.uid())
);

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

## 4. Disable email confirmation (for testing)
1. Go to Authentication > Settings
2. Under "User Signups", toggle OFF "Enable email confirmations"
3. Click Save

This will allow users to sign up without email verification during development.