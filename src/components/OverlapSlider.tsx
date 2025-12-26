import { useState, useMemo } from 'react';
import { SlidersHorizontal, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { EventData } from '@/types/event';

interface OverlapSliderProps {
  event: EventData;
  onFilterChange: (minOverlap: number | null, maxOverlap: number | null) => void;
}

export const OverlapSlider = ({ event, onFilterChange }: OverlapSliderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate unique overlap values that actually exist in the data
  const { availableOverlapValues, maxParticipants, actualMaxOverlap } = useMemo(() => {
    const overlapCounts = new Map<string, number>();
    const totalParticipants = event.availabilities.length;

    if (totalParticipants === 0) {
      return { availableOverlapValues: [0], maxParticipants: 0, actualMaxOverlap: 0 };
    }

    // Count how many participants are available for each slot
    event.dates.forEach(date => {
      const dateStr = new Date(date).toISOString();
      event.availabilities.forEach(avail => {
        avail.slots.forEach(slot => {
          if (slot.date === dateStr) {
            const key = `${slot.date}-${slot.time}`;
            const currentCount = overlapCounts.get(key) || 0;
            overlapCounts.set(key, currentCount + 1);
          }
        });
      });
    });

    // Get unique overlap values that exist
    const uniqueValues = new Set<number>();
    overlapCounts.forEach(count => {
      uniqueValues.add(count);
    });

    // Sort the values
    const sortedValues = Array.from(uniqueValues).sort((a, b) => a - b);
    
    // Always include 0 if there are empty slots
    if (!sortedValues.includes(0)) {
      sortedValues.unshift(0);
    }

    const maxOverlap = sortedValues.length > 0 ? sortedValues[sortedValues.length - 1] : 0;

    return {
      availableOverlapValues: sortedValues.length > 0 ? sortedValues : [0],
      maxParticipants: totalParticipants,
      actualMaxOverlap: maxOverlap
    };
  }, [event]);

  // State for the range slider - using actual overlap values (0 to actualMaxOverlap)
  const [rangeValue, setRangeValue] = useState<[number, number]>([0, actualMaxOverlap]);

  const handleRangeChange = (value: number[]) => {
    // Clamp values to actualMaxOverlap
    const clampedMin = Math.min(value[0], actualMaxOverlap);
    const clampedMax = Math.min(value[1], actualMaxOverlap);
    
    const newRange: [number, number] = [clampedMin, clampedMax];
    setRangeValue(newRange);
    
    // If range covers everything (0 to max), clear filter
    if (newRange[0] === 0 && newRange[1] === actualMaxOverlap) {
      onFilterChange(null, null);
    } else {
      onFilterChange(newRange[0], newRange[1]);
    }
  };

  const handleReset = () => {
    setRangeValue([0, actualMaxOverlap]);
    onFilterChange(null, null);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleReset();
    }
    setIsOpen(!isOpen);
  };

  // Only show if there are participants
  if (maxParticipants === 0) {
    return null;
  }

  // Calculate the percentage where the "usable" area ends
  const usablePercentage = maxParticipants > 0 ? (actualMaxOverlap / maxParticipants) * 100 : 100;

  return (
    <div className="space-y-3 w-full sm:w-auto">
      {/* Toggle Button */}
      <Button
        variant={isOpen ? "secondary" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter by Overlap
        {isOpen && (
          <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">
            {rangeValue[0]}-{rangeValue[1]}
          </span>
        )}
      </Button>

      {/* Slider Panel */}
      {isOpen && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4 animate-fade-in">
          {/* Header with summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Overlap: {rangeValue[0]} - {rangeValue[1]} People
              </span>
              <span className="text-xs text-muted-foreground">
                (max {actualMaxOverlap} of {maxParticipants})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Dual-thumb Range Slider */}
          <div className="px-1">
            <Slider
              value={rangeValue}
              onValueChange={handleRangeChange}
              min={0}
              max={actualMaxOverlap}
              step={1}
              className="w-full"
            />
            
            {/* Scale markers */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>{actualMaxOverlap}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
