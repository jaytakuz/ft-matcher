import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Trophy, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EventData, RecommendedSlot } from '@/types/event';

interface RecommendedTimesProps {
  event: EventData;
  onSelectTime?: (slot: RecommendedSlot) => void;
}

export const RecommendedTimes = ({ event, onSelectTime }: RecommendedTimesProps) => {
  const recommendations = useMemo(() => {
    if (event.availabilities.length < 2) return [];

    // Build a map of all time slots and who's available
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

    // Find consecutive slots with same participants
    const recommendations: RecommendedSlot[] = [];
    const dates = [...new Set(event.availabilities.flatMap(a => a.slots.map(s => s.date)))].sort();
    
    dates.forEach(date => {
      const dateSlots = Array.from(slotMap.entries())
        .filter(([key]) => key.startsWith(date))
        .map(([key, participants]) => ({
          time: key.split('|')[1],
          participants: Array.from(participants),
        }))
        .filter(s => s.participants.length >= 2)
        .sort((a, b) => a.time.localeCompare(b.time));

      // Group consecutive slots
      let currentGroup: typeof dateSlots = [];
      
      dateSlots.forEach((slot, i) => {
        const prev = dateSlots[i - 1];
        const isContinuous = prev && 
          slot.participants.length === prev.participants.length &&
          slot.participants.every(p => prev.participants.includes(p));

        if (!isContinuous && currentGroup.length > 0) {
          // Calculate score: users * 1000 + duration_in_minutes
          const durationMinutes = currentGroup.length * 30;
          const score = currentGroup[0].participants.length * 1000 + durationMinutes;
          
          recommendations.push({
            date,
            startTime: currentGroup[0].time,
            endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, 30),
            participants: currentGroup[0].participants,
            score,
          });
          currentGroup = [];
        }
        currentGroup.push(slot);
      });

      // Handle last group
      if (currentGroup.length > 0) {
        const durationMinutes = currentGroup.length * 30;
        const score = currentGroup[0].participants.length * 1000 + durationMinutes;
        
        recommendations.push({
          date,
          startTime: currentGroup[0].time,
          endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, 30),
          participants: currentGroup[0].participants,
          score,
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [event]);

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Best Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Need at least 2 participants with overlapping availability to show recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Best Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((slot, index) => (
          <div
            key={`${slot.date}-${slot.startTime}`}
            className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            onClick={() => onSelectTime?.(slot)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Badge variant="default" className="text-xs">
                      Top Pick
                    </Badge>
                  )}
                  <span className="font-medium text-sm">
                    {format(parseISO(slot.date), 'EEE, MMM d')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-primary">{slot.participants.length}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {slot.participants.slice(0, 3).join(', ')}
              {slot.participants.length > 3 && ` +${slot.participants.length - 3} more`}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}
