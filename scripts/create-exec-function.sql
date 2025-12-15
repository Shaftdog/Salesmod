-- Create a helper function to execute arbitrary SQL
-- This must be created first in Supabase Dashboard SQL Editor
-- Then we can call it from our scripts

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Grant execute permission to authenticated users (we'll use service role)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql IS 'Execute arbitrary SQL - USE WITH CAUTION';
