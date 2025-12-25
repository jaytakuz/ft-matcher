import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddToCalendarDialog } from './AddToCalendarDialog';
import type { EventData, RecommendedSlot } from '@/types/event';

interface AddToCalendarButtonProps {
  event: EventData;
  selectedSlot?: RecommendedSlot;
  disabled?: boolean;
}

export const AddToCalendarButton = ({ event, selectedSlot, disabled }: AddToCalendarButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = () => {
    // Mock confirmation - actual Google Calendar API integration will be added later
    setDialogOpen(false);
    toast({
      title: "Event created!",
      description: "Calendar invitations have been sent to all participants.",
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