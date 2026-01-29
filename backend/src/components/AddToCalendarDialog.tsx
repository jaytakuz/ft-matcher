import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, Sparkles } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
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
  const slotLength = event.slotLength || 30;
  const eventDuration = event.duration;

  const [eventName, setEventName] = useState(event.name);
  const [date, setDate] = useState(selectedSlot?.date || '');
  const [startTime, setStartTime] = useState(selectedSlot?.startTime || '');
  const [endTime, setEndTime] = useState(selectedSlot?.endTime || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(participantNames);
  const [mode, setMode] = useState<'picks' | 'manual'>('picks');

  // Calculate top 3 recommendations
  const topPicks = useMemo(() => {
    if (event.availabilities.length < 2) return [];

    const slotMap = new Map<string, Set<string>>();
    
    event.availabilities.forEach(availability => {
      availability.slots.forEach(slot => {
        const key = `${slot.date}|${slot.time}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, new Set());
        }
        slotMap.get(key)!.add(availability.participantName);
      });
    });

    const recommendations: RecommendedSlot[] = [];
    const dates = [...new Set(event.availabilities.flatMap(a => a.slots.map(s => s.date)))].sort();
    const requiredSlots = eventDuration ? Math.ceil(eventDuration / slotLength) : null;
    
    dates.forEach(date => {
      const dateSlots = Array.from(slotMap.entries())
        .filter(([key]) => key.startsWith(date))
        .map(([key, participants]) => ({
          time: key.split('|')[1],
          participants: Array.from(participants),
        }))
        .filter(s => s.participants.length >= 2)
        .sort((a, b) => a.time.localeCompare(b.time));

      let currentGroup: typeof dateSlots = [];
      
      dateSlots.forEach((slot, i) => {
        const prev = dateSlots[i - 1];
        const isContinuous = prev && 
          slot.participants.length === prev.participants.length &&
          slot.participants.every(p => prev.participants.includes(p)) &&
          isConsecutiveTime(prev.time, slot.time, slotLength);

        if (!isContinuous && currentGroup.length > 0) {
          const groupDurationMinutes = currentGroup.length * slotLength;
          
          if (!requiredSlots || currentGroup.length >= requiredSlots) {
            let durationScore = groupDurationMinutes;
            if (requiredSlots) {
              const targetDuration = requiredSlots * slotLength;
              if (groupDurationMinutes === targetDuration) {
                durationScore = 500;
              } else if (groupDurationMinutes > targetDuration) {
                durationScore = 400 - (groupDurationMinutes - targetDuration);
              }
            }
            
            const score = currentGroup[0].participants.length * 1000 + durationScore;
            
            recommendations.push({
              date,
              startTime: currentGroup[0].time,
              endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, slotLength),
              participants: currentGroup[0].participants,
              score,
            });
          }
          currentGroup = [];
        }
        currentGroup.push(slot);
      });

      if (currentGroup.length > 0) {
        const groupDurationMinutes = currentGroup.length * slotLength;
        
        if (!requiredSlots || currentGroup.length >= requiredSlots) {
          let durationScore = groupDurationMinutes;
          if (requiredSlots) {
            const targetDuration = requiredSlots * slotLength;
            if (groupDurationMinutes === targetDuration) {
              durationScore = 500;
            } else if (groupDurationMinutes > targetDuration) {
              durationScore = 400 - (groupDurationMinutes - targetDuration);
            }
          }
          
          const score = currentGroup[0].participants.length * 1000 + durationScore;
          
          recommendations.push({
            date,
            startTime: currentGroup[0].time,
            endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, slotLength),
            participants: currentGroup[0].participants,
            score,
          });
        }
      }
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [event, slotLength, eventDuration]);

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

  const handlePickSelect = (pick: RecommendedSlot) => {
    setDate(pick.date);
    setStartTime(pick.startTime);
    setEndTime(pick.endTime);
    // Auto-select only participants available for this pick
    setSelectedParticipants(pick.participants);
  };

  const handleParticipantToggle = (name: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  // Get the participants available for the selected pick
  const availableParticipantsForPick = useMemo(() => {
    if (mode === 'picks' && date && startTime) {
      const selectedPick = topPicks.find(p => p.date === date && p.startTime === startTime);
      if (selectedPick) {
        return selectedPick.participants;
      }
    }
    return participantNames;
  }, [mode, date, startTime, topPicks, participantNames]);

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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTimeDisplay = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
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

          {/* Date/Time Selection Mode */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'picks' | 'manual')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="picks" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Top Picks
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="picks" className="mt-3 space-y-2">
              {topPicks.length > 0 ? (
                topPicks.map((pick, index) => (
                  <div
                    key={`${pick.date}-${pick.startTime}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      date === pick.date && startTime === pick.startTime
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                    onClick={() => handlePickSelect(pick)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Top Pick
                            </Badge>
                          )}
                          {index === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              #2
                            </Badge>
                          )}
                          {index === 2 && (
                            <Badge variant="secondary" className="text-xs">
                              #3
                            </Badge>
                          )}
                          <span className="font-medium text-sm">
                            {format(parseISO(pick.date), 'EEE, MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeDisplay(pick.startTime)} - {formatTimeDisplay(pick.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-primary">{pick.participants.length}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Need at least 2 participants with overlapping availability.
                </p>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-3 space-y-3">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                {selectedSlot?.date && (
                  <p className="text-xs">
                    <span className="text-foreground">Top Pick!: </span>
                    <span className="text-primary font-medium">{formatDateDisplay(selectedSlot.date)}</span>
                  </p>
                )}
                <Input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
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
            </TabsContent>
          </Tabs>

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
                participantNames.map((name, i) => {
                  const isAvailable = availableParticipantsForPick.includes(name);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox
                        id={`participant-${i}`}
                        checked={selectedParticipants.includes(name)}
                        onCheckedChange={() => handleParticipantToggle(name)}
                      />
                      <Label
                        htmlFor={`participant-${i}`}
                        className={`text-sm font-normal cursor-pointer flex-1 truncate ${
                          !isAvailable && mode === 'picks' ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {name}
                      </Label>
                      {!isAvailable && mode === 'picks' && date && startTime && (
                        <span className="text-xs text-muted-foreground">(unavailable)</span>
                      )}
                    </div>
                  );
                })
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

function isConsecutiveTime(time1: string, time2: string, slotLength: number): boolean {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  return minutes2 - minutes1 === slotLength;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}