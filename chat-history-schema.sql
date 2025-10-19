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

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from own sessions" ON chat_messages FOR SELECT USING (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create messages in own sessions" ON chat_messages FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete messages from own sessions" ON chat_messages FOR DELETE USING (
  session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);