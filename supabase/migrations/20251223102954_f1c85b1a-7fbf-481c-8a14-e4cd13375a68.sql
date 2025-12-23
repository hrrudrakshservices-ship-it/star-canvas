-- Add account_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

-- Add comment explaining the logic
COMMENT ON COLUMN public.profiles.is_public IS 'Account visibility. Private accounts can convert to public, but public cannot convert to private.';