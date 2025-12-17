import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { CalendarDays, Clock, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { generateEventId, generateTimeSlots } from '@/lib/dateUtils';
import type { EventData } from '@/types/event';

const timeOptions = generateTimeSlots('06:00', '24:00', 60);

export const EventForm = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [hostName, setHostName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleCreateEvent = () => {
    if (!eventName || !hostName || selectedDates.length === 0) return;

    const eventData: EventData = {
      id: generateEventId(),
      name: eventName,
      hostName,
      dates: selectedDates.map(d => d.toISOString()),
      startTime,
      endTime,
      availabilities: [],
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage for demo (would use database in production)
    localStorage.setItem(`event-${eventData.id}`, JSON.stringify(eventData));
    
    navigate(`/event/${eventData.id}`);
  };

  const isFormValid = eventName && hostName && selectedDates.length > 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <Label htmlFor="eventName" className="text-sm font-medium">
          Event Name
        </Label>
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Team Sync, Project Kickoff..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hostName" className="text-sm font-medium">
          Your Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="hostName"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Enter your name"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Dates</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDates.length && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectedDates.length > 0
                ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates || [])}
              disabled={(date) => date < addDays(new Date(), -1)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {selectedDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedDates.slice(0, 5).map((date, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {format(date, 'MMM d')}
              </span>
            ))}
            {selectedDates.length > 5 && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                +{selectedDates.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Time</Label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">End Time</Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} disabled={time <= startTime}>
                  {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleCreateEvent}
        disabled={!isFormValid}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        Create Event
      </Button>
    </div>
  );
};
