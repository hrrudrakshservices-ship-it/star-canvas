-- Add continent, district, age to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS continent text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS age integer;

-- Add title, description to images (separate from caption)
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text;

-- Create report_type enum
DO $$ BEGIN
    CREATE TYPE public.report_type AS ENUM ('copyright', 'nudity', 'spam', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add report_type column to reports
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS report_type public.report_type DEFAULT 'other';

-- Create streaks table to track how many days a photo stays in top list
CREATE TABLE IF NOT EXISTS public.streaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    streak_type text NOT NULL, -- 'continent', 'country', 'state', 'district', 'city'
    location_value text NOT NULL, -- The actual location name
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_in_top_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(image_id, streak_type, location_value)
);

-- Enable RLS on streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Streaks are viewable by everyone
CREATE POLICY "Streaks are viewable by everyone" 
ON public.streaks 
FOR SELECT 
USING (true);

-- System can manage streaks (via triggers/functions)
CREATE POLICY "System can insert streaks" 
ON public.streaks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update streaks" 
ON public.streaks 
FOR UPDATE 
USING (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_images_continent ON public.profiles(continent);
CREATE INDEX IF NOT EXISTS idx_images_district ON public.profiles(district);
CREATE INDEX IF NOT EXISTS idx_streaks_image_id ON public.streaks(image_id);
CREATE INDEX IF NOT EXISTS idx_images_average_rating ON public.images(average_rating DESC);