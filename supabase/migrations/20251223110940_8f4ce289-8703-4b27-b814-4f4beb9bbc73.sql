-- Drop foreign key constraints on images and ratings tables to allow seed data
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_user_id_fkey;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;