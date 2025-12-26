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
  const { availableOverlapValues, maxParticipants } = useMemo(() => {
    const overlapCounts = new Map<string, number>();
    const totalParticipants = event.availabilities.length;

    if (totalParticipants === 0) {
      return { availableOverlapValues: [0], maxParticipants: 0 };
    }

    // Count how many participants are available for each slot
    event.dates.forEach(date => {
      const dateStr = new Date(date).toISOString();
      // We need to check all time slots - use a reasonable range
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

    return {
      availableOverlapValues: sortedValues.length > 0 ? sortedValues : [0],
      maxParticipants: totalParticipants
    };
  }, [event]);

  // State for the range slider
  const [rangeValue, setRangeValue] = useState<[number, number]>([0, availableOverlapValues.length - 1]);

  // Map slider position to actual overlap value
  const minOverlapValue = availableOverlapValues[rangeValue[0]] ?? 0;
  const maxOverlapValue = availableOverlapValues[rangeValue[1]] ?? maxParticipants;

  const handleRangeChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setRangeValue(newRange);
    
    const minVal = availableOverlapValues[newRange[0]] ?? 0;
    const maxVal = availableOverlapValues[newRange[1]] ?? maxParticipants;
    
    // If range covers everything, clear filter
    if (newRange[0] === 0 && newRange[1] === availableOverlapValues.length - 1) {
      onFilterChange(null, null);
    } else {
      onFilterChange(minVal, maxVal);
    }
  };

  const handleReset = () => {
    setRangeValue([0, availableOverlapValues.length - 1]);
    onFilterChange(null, null);
  };

  const handleToggle = () => {
    if (isOpen) {
      // When closing, reset the filter
      handleReset();
    }
    setIsOpen(!isOpen);
  };

  // Only show if there are participants
  if (maxParticipants === 0) {
    return null;
  }

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
            {minOverlapValue}-{maxOverlapValue}
          </span>
        )}
      </Button>

      {/* Slider Panel */}
      {isOpen && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              <span>Overlap Filter</span>
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

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background rounded-md p-2">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-semibold text-primary">{maxParticipants}</div>
            </div>
            <div className="bg-background rounded-md p-2">
              <div className="text-xs text-muted-foreground">Min Showing</div>
              <div className="text-lg font-semibold text-foreground">{minOverlapValue}</div>
            </div>
            <div className="bg-background rounded-md p-2">
              <div className="text-xs text-muted-foreground">Max Overlap</div>
              <div className="text-lg font-semibold text-foreground">{maxOverlapValue}</div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="px-2">
            <Slider
              value={rangeValue}
              onValueChange={handleRangeChange}
              min={0}
              max={availableOverlapValues.length - 1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Available Values Display */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>0 people</span>
            <span>{availableOverlapValues[availableOverlapValues.length - 1]} people</span>
          </div>


          <p className="text-xs text-muted-foreground">
            Showing slots where {minOverlapValue === maxOverlapValue 
              ? `exactly ${minOverlapValue} ${minOverlapValue === 1 ? 'person is' : 'people are'}`
              : `${minOverlapValue} to ${maxOverlapValue} people are`
            } available
          </p>
        </div>
      )}
    </div>
  );
};
