import { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateTimeSlots, formatTimeSlot, formatDateHeader } from '@/lib/dateUtils';
import type { EventData, TimeSlot, VisualizationMode, Availability } from '@/types/event';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
interface AvailabilityGridProps {
  event: EventData;
  currentUser?: string;
  isEditMode: boolean;
  visualizationMode: VisualizationMode;
  selectedSlots: TimeSlot[];
  onSlotsChange: (slots: TimeSlot[]) => void;
  showOthersAvailability?: boolean;
}
const DAYS_PER_PAGE = 7;
export const AvailabilityGrid = ({
  event,
  currentUser,
  isEditMode,
  visualizationMode,
  selectedSlots,
  onSlotsChange,
  showOthersAvailability = true
}: AvailabilityGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<TimeSlot | null>(null);
  const [isAdding, setIsAdding] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const timeSlots = generateTimeSlots(event.startTime, event.endTime, 30);
  const allDates = event.dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const totalPages = Math.ceil(allDates.length / DAYS_PER_PAGE);
  const startIdx = currentPage * DAYS_PER_PAGE;
  const dates = allDates.slice(startIdx, startIdx + DAYS_PER_PAGE);
  const getSlotKey = (date: string, time: string) => `${date}-${time}`;
  const isSlotSelected = (date: string, time: string): boolean => {
    return selectedSlots.some(s => s.date === date && s.time === time);
  };
  const getAvailabilityCount = (date: string, time: string): number => {
    if (!showOthersAvailability && !isEditMode) return 0;
    return event.availabilities.filter(a => a.slots.some(s => s.date === date && s.time === time)).length;
  };
  const getAvailableParticipants = (date: string, time: string): string[] => {
    if (!showOthersAvailability && !isEditMode) return [];
    return event.availabilities.filter(a => a.slots.some(s => s.date === date && s.time === time)).map(a => a.participantName);
  };
  const totalParticipants = event.availabilities.length || 1;
  const getHeatmapColor = (count: number): string => {
    if (!showOthersAvailability && !isEditMode) return 'bg-available-0';
    if (count === 0) return 'bg-available-0';
    const percentage = count / totalParticipants * 100;
    if (percentage <= 25) return 'bg-available-25';
    if (percentage <= 50) return 'bg-available-50';
    if (percentage <= 75) return 'bg-available-75';
    return 'bg-available-100';
  };
  const handleSlotInteraction = useCallback((date: string, time: string) => {
    if (!isEditMode) return;
    const slot: TimeSlot = {
      date,
      time
    };
    const isCurrentlySelected = isSlotSelected(date, time);
    if (!isDragging) {
      // Start of a new drag - determine if we're adding or removing
      setIsAdding(!isCurrentlySelected);
    }
    if (isAdding && !isCurrentlySelected) {
      onSlotsChange([...selectedSlots, slot]);
    } else if (!isAdding && isCurrentlySelected) {
      onSlotsChange(selectedSlots.filter(s => !(s.date === date && s.time === time)));
    }
  }, [isEditMode, isDragging, isAdding, selectedSlots, onSlotsChange]);
  const handleMouseDown = (date: string, time: string) => {
    if (!isEditMode) return;
    setIsDragging(true);
    setDragStartSlot({
      date,
      time
    });
    const isCurrentlySelected = isSlotSelected(date, time);
    setIsAdding(!isCurrentlySelected);
    handleSlotInteraction(date, time);
  };
  const handleMouseEnter = (date: string, time: string) => {
    if (isDragging && isEditMode) {
      handleSlotInteraction(date, time);
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStartSlot(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = (date: string, time: string) => {
    if (!isEditMode) return;
    setIsDragging(true);
    const isCurrentlySelected = isSlotSelected(date, time);
    setIsAdding(!isCurrentlySelected);
    handleSlotInteraction(date, time);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isEditMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotData = element?.getAttribute('data-slot');
    if (slotData) {
      const [date, time] = slotData.split('|');
      handleSlotInteraction(date, time);
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(0, p - 1));
  };
  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  };
  return <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Pagination Header */}
      {totalPages > 1 && <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={handlePrevPage} disabled={currentPage === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages - 1}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>}

      <div ref={gridRef} className="flex overflow-x-auto" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* Time column - sticky */}
        <div className="sticky left-0 z-10 bg-card border-r border-border">
          <div className="h-16 border-b border-border" /> {/* Header spacer */}
          {timeSlots.map(time => <div key={time} className="h-8 px-2 text-xs text-muted-foreground border-b border-border/50 min-w-[60px] flex items-start justify-end">
              {formatTimeSlot(time)}
            </div>)}
        </div>

        {/* Date columns */}
        <div className="flex flex-1">
          {dates.map(date => {
          const dateStr = date.toISOString();
          const header = formatDateHeader(dateStr);
          return <div key={dateStr} className="flex-1 min-w-[48px] sm:min-w-[56px]">
                {/* Date header */}
                <div className="h-16 flex flex-col items-center justify-center border-b border-border px-1">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {header.day}
                  </span>
                  <span className="text-lg font-semibold">{header.date}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {header.month}
                  </span>
                </div>

                {/* Time slots */}
                {timeSlots.map(time => {
              const count = getAvailabilityCount(dateStr, time);
              const isSelected = isSlotSelected(dateStr, time);
              const participants = getAvailableParticipants(dateStr, time);
              const colorClass = isEditMode && isSelected ? 'bg-primary' : getHeatmapColor(count);
              const slotContent = <div data-slot={`${dateStr}|${time}`} className={cn("h-8 border-b border-r border-border/30 transition-colors", colorClass, isEditMode && "cursor-pointer hover:opacity-80", isEditMode && isSelected && "ring-1 ring-primary-foreground/50 ring-inset")} onMouseDown={() => handleMouseDown(dateStr, time)} onMouseEnter={() => handleMouseEnter(dateStr, time)} onTouchStart={() => handleTouchStart(dateStr, time)} />;
              if (!isEditMode && participants.length > 0 && showOthersAvailability) {
                return <Tooltip key={getSlotKey(dateStr, time)}>
                        <TooltipTrigger asChild>
                          {slotContent}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="font-medium text-sm mb-1">
                            {participants.length} available
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participants.join(', ')}
                          </p>
                        </TooltipContent>
                      </Tooltip>;
              }
              return <div key={getSlotKey(dateStr, time)}>{slotContent}</div>;
            })}
              </div>;
        })}
        </div>
      </div>
    </div>;
};