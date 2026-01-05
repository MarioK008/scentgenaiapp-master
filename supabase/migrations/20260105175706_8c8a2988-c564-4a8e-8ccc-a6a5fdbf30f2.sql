-- Fix function search_path issues for security

-- 1. Fix match_knowledge_chunks function with explicit search_path
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector, 
  match_threshold double precision DEFAULT 0.78, 
  match_count integer DEFAULT 5, 
  filter_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(id uuid, document_id uuid, content text, similarity double precision, document_title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 2. Fix update_updated_at function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;