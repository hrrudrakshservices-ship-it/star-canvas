-- Add unique constraints on username and email
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add name column for display name (separate from username)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text;