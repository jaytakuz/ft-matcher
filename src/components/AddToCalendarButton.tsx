import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddToCalendarDialog, type CalendarEventData } from './AddToCalendarDialog';
import type { EventData, RecommendedSlot } from '@/types/event';
import { supabase } from '@/integrations/supabase/client';

interface AddToCalendarButtonProps {
  event: EventData;
  selectedSlot?: RecommendedSlot;
  disabled?: boolean;
}

export const AddToCalendarButton = ({ event, selectedSlot, disabled }: AddToCalendarButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async (data: CalendarEventData) => {
    try {
      console.log("Final Booking Data:", data); 

      // ---------------------------------------------------------
      // 1. Check Token & Auto Login (Modified) 🔐
      // ---------------------------------------------------------
      const { data: { session } } = await supabase.auth.getSession();
      const googleToken = session?.provider_token;

      if (!googleToken) {
        toast({
          title: "Login Required",
          description: "Redirecting to Google Login to enable calendar access...",
        });

        // Redirect user to login and come back to THIS page
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/calendar',
            redirectTo: window.location.href, // 👈 Key Logic
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;
        return; // Stop execution here
      }

      // ---------------------------------------------------------
      // 2. 🟢 เชื่อ data จาก Dialog 100%
      // ---------------------------------------------------------

      // A. จัดการวันที่ (Date) 📅
      let year, month, day;
      if (data.date.includes('T')) {
         const dateObj = new Date(data.date);
         year = dateObj.getFullYear();
         month = dateObj.getMonth() + 1;
         day = dateObj.getDate();
      } else {
         [year, month, day] = data.date.split('-').map(Number);
      }

      // B. จัดการเวลา (Time) ⏰
      const parseTime = (str: string) => {
        if (!str) return { h: 0, m: 0 };
        const cleanStr = str.trim();
        const [timePart, modifier] = cleanStr.split(' '); 
        let [h, m = 0] = timePart.split(':').map(Number);

        if (modifier === 'PM' && h < 12) h += 12;
        if (modifier === 'AM' && h === 12) h = 0;
        return { h, m };
      };

      const startT = parseTime(data.startTime); 
      const endT = parseTime(data.endTime);     

      const startDateTime = new Date(year, month - 1, day, startT.h, startT.m);
      const endDateTime = new Date(year, month - 1, day, endT.h, endT.m);

      if (endDateTime < startDateTime) {
         endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error(`Invalid date/time processing. Date: ${data.date}, Start: ${data.startTime}`);
      }
      
      const startISO = startDateTime.toISOString();
      const endISO = endDateTime.toISOString();

      // ---------------------------------------------------------
      // 3. Create Event
      // ---------------------------------------------------------
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: data.eventName,
          description: `Event created from Freetime Matcher.\nParticipants: ${data.selectedParticipants.join(', ')}`,
          start: {
            dateTime: startISO,
            timeZone: "Asia/Bangkok"
          },
          end: {
            dateTime: endISO,
            timeZone: "Asia/Bangkok"
          },
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const calendarEvent = await response.json();

      setDialogOpen(false);
      toast({
        title: "Event created successfully! 🎉",
        description: `"${data.eventName}" scheduled on ${day}/${month}/${year}.`,
      });

      console.log('Google Calendar event created:', calendarEvent);

    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Failed to create event",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        className="w-full"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Add to Google Calendar
      </Button>

      <AddToCalendarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={event}
        selectedSlot={selectedSlot}
        onConfirm={handleConfirm}
      />
    </>
  );
};