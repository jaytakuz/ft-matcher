import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Trophy, Users, Clock, Sparkles } from 'lucide-react';
import type { EventData, RecommendedSlot } from '@/types/event';

interface TopRecommendationProps {
  event: EventData;
}

export const TopRecommendation = ({ event }: TopRecommendationProps) => {
  const topRecommendation = useMemo(() => {
    if (event.availabilities.length < 2) return null;

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

    const sorted = recommendations.sort((a, b) => b.score - a.score);
    return sorted[0] || null;
  }, [event]);

  if (!topRecommendation) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary">Best Match Found!</span>
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Users className="h-3 w-3" />
              {topRecommendation.participants.length} available
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span>{format(parseISO(topRecommendation.date), 'EEE, MMM d')}</span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {formatTimeDisplay(topRecommendation.startTime)} - {formatTimeDisplay(topRecommendation.endTime)}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {topRecommendation.participants.join(', ')}
          </div>
        </div>
      </div>
    </div>
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