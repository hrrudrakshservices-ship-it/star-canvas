-- Temporarily drop foreign key constraint to allow seed data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;