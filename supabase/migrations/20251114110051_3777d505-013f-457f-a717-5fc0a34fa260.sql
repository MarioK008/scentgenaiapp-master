-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store document metadata
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on knowledge_documents
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_documents
CREATE POLICY "Users can view their own documents"
  ON knowledge_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON knowledge_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON knowledge_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON knowledge_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Table to store document chunks with embeddings
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  chunk_index INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on knowledge_chunks
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_chunks
CREATE POLICY "Users can view chunks of their documents"
  ON knowledge_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents
      WHERE knowledge_documents.id = knowledge_chunks.document_id
      AND knowledge_documents.user_id = auth.uid()
    )
  );

-- Index for efficient vector similarity search
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for semantic search
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_title text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kd.title as document_title
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE 
    1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (filter_user_id IS NULL OR kd.user_id = filter_user_id)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-pdfs', 'knowledge-pdfs', false);

-- Storage policies for knowledge-pdfs bucket
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'knowledge-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );