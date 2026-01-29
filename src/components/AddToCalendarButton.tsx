import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddToCalendarDialog, type CalendarEventData } from './AddToCalendarDialog';
import type { EventData, RecommendedSlot } from '@/types/event';

interface AddToCalendarButtonProps {
  event: EventData;
  selectedSlot?: RecommendedSlot;
  disabled?: boolean;
}

export const AddToCalendarButton = ({ event, selectedSlot, disabled }: AddToCalendarButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = (data: CalendarEventData) => {
    // Mock confirmation - actual Google Calendar API integration will be added later
    console.log('Calendar event data:', data);
    setDialogOpen(false);
    toast({
      title: "Event created!",
      description: `"${data.eventName}" scheduled for ${data.date} with ${data.selectedParticipants.length} participant(s).`,
    });
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