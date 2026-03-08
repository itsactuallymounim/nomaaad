
-- Add embedding columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE public.saved_places ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create similarity search function
CREATE OR REPLACE FUNCTION public.match_saved_places(
  query_embedding vector(1024),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  category text,
  list_id uuid,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name,
    sp.description,
    sp.address,
    sp.category,
    sp.list_id,
    (1 - (sp.embedding <=> query_embedding))::float AS similarity
  FROM saved_places sp
  WHERE sp.user_id = match_user_id
    AND sp.embedding IS NOT NULL
    AND (1 - (sp.embedding <=> query_embedding))::float > match_threshold
  ORDER BY sp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
