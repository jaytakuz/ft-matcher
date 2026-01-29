-- Add slot_length column to events table (default 30 minutes)
ALTER TABLE public.events 
ADD COLUMN slot_length integer DEFAULT 30;