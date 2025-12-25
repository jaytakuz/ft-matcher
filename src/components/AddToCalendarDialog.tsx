import { Calendar, Clock, Users, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { EventData, RecommendedSlot } from '@/types/event';

interface AddToCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  selectedSlot?: RecommendedSlot;
  onConfirm: () => void;
}

export const AddToCalendarDialog = ({
  open,
  onOpenChange,
  event,
  selectedSlot,
  onConfirm,
}: AddToCalendarDialogProps) => {
  const participantNames = event.availabilities.map((a) => a.participantName);

  const formatSlotTime = () => {
    if (!selectedSlot) return 'No time selected';
    const date = format(new Date(selectedSlot.date), 'EEEE, MMMM d, yyyy');
    return `${date} at ${selectedSlot.startTime} - ${selectedSlot.endTime}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add to Google Calendar
          </DialogTitle>
          <DialogDescription>
            Create a calendar event and send invitations to all participants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Name */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Event</p>
              <p className="text-sm text-muted-foreground">{event.name}</p>
            </div>
          </div>

          {/* Selected Time */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">{formatSlotTime()}</p>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Participants</p>
              <p className="text-sm text-muted-foreground">
                {event.availabilities.length} participant{event.availabilities.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Invitations */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Will be invited</p>
              {participantNames.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {participantNames.slice(0, 3).map((name, i) => (
                    <p key={i} className="text-sm text-muted-foreground truncate">
                      {name}
                    </p>
                  ))}
                  {participantNames.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{participantNames.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No participants yet
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!selectedSlot}>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
