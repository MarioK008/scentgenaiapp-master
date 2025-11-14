-- Create voice_conversations table
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('live', 'dictated')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations"
  ON voice_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON voice_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON voice_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON voice_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX idx_voice_conversations_created_at ON voice_conversations(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_voice_conversations_updated_at
  BEFORE UPDATE ON voice_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();