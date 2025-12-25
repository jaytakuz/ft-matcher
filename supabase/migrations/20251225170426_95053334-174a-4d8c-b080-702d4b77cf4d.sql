-- Add date_only column to events table
ALTER TABLE public.events 
ADD COLUMN date_only boolean NOT NULL DEFAULT false;