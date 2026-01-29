-- Add require_email column to events table
ALTER TABLE public.events 
ADD COLUMN require_email boolean NOT NULL DEFAULT false;