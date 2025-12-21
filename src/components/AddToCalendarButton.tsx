import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { EventData, RecommendedSlot } from '@/types/event';

interface AddToCalendarButtonProps {
  event: EventData;
  selectedSlot?: RecommendedSlot;
  disabled?: boolean;
}

export const AddToCalendarButton = ({ event, selectedSlot, disabled }: AddToCalendarButtonProps) => {
  const { toast } = useToast();

  const handleAddToCalendar = () => {
    // For now, just show a toast - actual implementation will be added later
    toast({
      title: "Coming soon!",
      description: "Google Calendar integration will be available soon.",
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleAddToCalendar}
      disabled={disabled}
      className="w-full"
    >
      <Calendar className="h-4 w-4 mr-2" />
      Add to Google Calendar
    </Button>
  );
};