import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Mail, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import type { EventData, RecommendedSlot } from '@/types/event';

interface AddToCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  selectedSlot?: RecommendedSlot;
  onConfirm: (data: CalendarEventData) => void;
}

export interface CalendarEventData {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  selectedParticipants: string[];
}

export const AddToCalendarDialog = ({
  open,
  onOpenChange,
  event,
  selectedSlot,
  onConfirm,
}: AddToCalendarDialogProps) => {
  const participantNames = event.availabilities.map((a) => a.participantName);

  const [eventName, setEventName] = useState(event.name);
  const [date, setDate] = useState(selectedSlot?.date || '');
  const [startTime, setStartTime] = useState(selectedSlot?.startTime || '');
  const [endTime, setEndTime] = useState(selectedSlot?.endTime || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(participantNames);

  useEffect(() => {
    setEventName(event.name);
    setSelectedParticipants(participantNames);
  }, [event.name, event.availabilities]);

  useEffect(() => {
    if (open && selectedSlot) {
      setDate(selectedSlot.date);
      setStartTime(selectedSlot.startTime);
      setEndTime(selectedSlot.endTime);
    }
  }, [open, selectedSlot]);

  const handleParticipantToggle = (name: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedParticipants(participantNames);
  };

  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  const handleConfirm = () => {
    onConfirm({
      eventName,
      date,
      startTime,
      endTime,
      selectedParticipants,
    });
  };

  const formatDateDisplay = () => {
    if (!date) return '';
    try {
      return format(new Date(date), 'EEEE, MMMM d, yyyy');
    } catch {
      return date;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Add to Google Calendar
          </DialogTitle>
          <DialogDescription>
            Review and edit event details before creating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Event Name
            </Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="event-date" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Date
            </Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {date && (
              <p className="text-xs text-muted-foreground">{formatDateDisplay()}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Participants ({selectedParticipants.length}/{participantNames.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-7 text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {participantNames.length > 0 ? (
                participantNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      id={`participant-${i}`}
                      checked={selectedParticipants.includes(name)}
                      onCheckedChange={() => handleParticipantToggle(name)}
                    />
                    <Label
                      htmlFor={`participant-${i}`}
                      className="text-sm font-normal cursor-pointer flex-1 truncate"
                    >
                      {name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!eventName || !date || !startTime || !endTime}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};