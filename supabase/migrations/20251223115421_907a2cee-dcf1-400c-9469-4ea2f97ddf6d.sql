-- Add AI detection columns to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS ai_detected boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_confidence integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_detection_reason text DEFAULT NULL;