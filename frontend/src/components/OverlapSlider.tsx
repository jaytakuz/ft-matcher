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
              <div className="text-lg font-semibold text-foreground">{rangeValue[0]}</div>
            </div>
            <div className="bg-background rounded-md p-2">
              <div className="text-xs text-muted-foreground">Max Overlap</div>
              <div className="text-lg font-semibold text-foreground">{actualMaxOverlap}</div>
            </div>
          </div>

          {/* Custom Range Slider with visual indicator */}
          <div className="px-2 relative">
            {/* Background track showing full range (0 to Total) */}
            <div className="relative h-2 w-full rounded-full bg-secondary">
              {/* Usable area indicator */}
              <div 
                className="absolute h-full rounded-full bg-secondary"
                style={{ width: `${usablePercentage}%` }}
              />
              {/* Disabled/unavailable area */}
              {actualMaxOverlap < maxParticipants && (
                <div 
                  className="absolute h-full rounded-r-full bg-muted-foreground/20"
                  style={{ 
                    left: `${usablePercentage}%`, 
                    width: `${100 - usablePercentage}%` 
                  }}
                />
              )}
            </div>
            
            {/* Actual slider - limited to actualMaxOverlap */}
            <div className="absolute inset-0" style={{ width: `${usablePercentage}%` }}>
              <Slider
                value={rangeValue}
                onValueChange={handleRangeChange}
                min={0}
                max={actualMaxOverlap}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Scale markers */}
          <div className="relative text-xs text-muted-foreground px-1 h-5">
            <span className="absolute left-0">0</span>
            {actualMaxOverlap < maxParticipants && (
              <span 
                className="absolute text-primary font-medium -translate-x-1/2"
                style={{ left: `${usablePercentage}%` }}
              >
                {actualMaxOverlap}
              </span>
            )}
            <span className={`absolute right-0 ${actualMaxOverlap < maxParticipants ? "text-muted-foreground/50" : ""}`}>
              {maxParticipants}
            </span>
          </div>

          {/* Info text */}
          {actualMaxOverlap < maxParticipants && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              💡Filtering {rangeValue[0]} to {rangeValue[1]} people are available
            </p>
          )}

        </div>
      )}
    </div>
  );
};
