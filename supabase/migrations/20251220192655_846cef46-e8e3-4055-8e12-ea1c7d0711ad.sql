-- Create events table
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_name TEXT NOT NULL,
  host_email TEXT,
  dates TEXT[] NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create availabilities table
CREATE TABLE public.availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, participant_name)
);

-- Create slots table for availability time slots
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_id UUID NOT NULL REFERENCES public.availabilities(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL
);

-- Enable Row Level Security (public access for now, no auth required)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can CRUD events)
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON public.events FOR DELETE USING (true);

-- Create policies for availabilities
CREATE POLICY "Anyone can read availabilities" ON public.availabilities FOR SELECT USING (true);
CREATE POLICY "Anyone can create availabilities" ON public.availabilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update availabilities" ON public.availabilities FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete availabilities" ON public.availabilities FOR DELETE USING (true);

-- Create policies for slots
CREATE POLICY "Anyone can read slots" ON public.slots FOR SELECT USING (true);
CREATE POLICY "Anyone can create slots" ON public.slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update slots" ON public.slots FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete slots" ON public.slots FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_availabilities_event_id ON public.availabilities(event_id);
CREATE INDEX idx_slots_availability_id ON public.slots(availability_id);