import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { CalendarDays, Clock, User, Sparkles, Loader2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DraggableCalendar } from '@/components/DraggableCalendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { generateEventId, generateTimeSlots, formatTimeSlot } from '@/lib/dateUtils';
import { createEvent } from '@/lib/eventService';
import { useToast } from '@/hooks/use-toast';
import type { EventData } from '@/types/event';

const timeOptions = generateTimeSlots('06:00', '24:00', 60);

export const EventForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventName, setEventName] = useState('');
  const [hostName, setHostName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState('');
  const [slotLength, setSlotLength] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (!eventName || !hostName || selectedDates.length === 0) return;

    setIsLoading(true);

    const eventData = {
      id: generateEventId(),
      name: eventName,
      hostName,
      dates: selectedDates.map(d => d.toISOString()),
      startTime,
      endTime,
      duration: duration && duration !== 'none' ? parseInt(duration) : undefined,
      slotLength: parseInt(slotLength),
      createdAt: new Date().toISOString(),
    };

    const { error } = await createEvent(eventData);

    if (error) {
      toast({
        title: "Error creating event",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
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
            <DraggableCalendar
              selected={selectedDates}
              onSelect={setSelectedDates}
              disabled={(date) => date < addDays(new Date(), -1)}
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
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTimeSlot(time)}
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
              <SelectValue placeholder="Select end time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} disabled={time <= startTime}>
                  {formatTimeSlot(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slotLength" className="text-sm font-medium">
            Slot Length
          </Label>
          <Select value={slotLength} onValueChange={setSlotLength}>
            <SelectTrigger>
              <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select slot length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">
            Event Duration <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No preference</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleCreateEvent}
        disabled={!isFormValid || isLoading}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Event"
        )}
      </Button>
    </div>
  );
};