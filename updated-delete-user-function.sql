-- Drop the old function if it exists
DROP FUNCTION IF EXISTS delete_user();
DROP FUNCTION IF EXISTS delete_user_completely();

-- Create improved function to completely delete user including chat history
CREATE OR REPLACE FUNCTION delete_user_completely()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Delete chat history (messages will cascade delete due to foreign key)
  DELETE FROM public.chat_sessions WHERE user_id = user_id;
  
  -- Delete from profiles table first (if exists)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Delete from agents table (if exists)
  DELETE FROM public.agents WHERE creator_id = user_id;
  
  -- Delete from executions table (if exists)
  DELETE FROM public.executions WHERE user_id = user_id;
  
  -- Delete from earnings table (if exists)
  DELETE FROM public.earnings WHERE agent_id IN (
    SELECT id FROM public.agents WHERE creator_id = user_id
  );
  
  -- Delete from transactions table (if exists)
  DELETE FROM public.transactions WHERE user_id = user_id;
  
  -- Finally delete from auth.users (this completely removes the user)
  DELETE FROM auth.users WHERE id = user_id;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user_completely() TO authenticated;