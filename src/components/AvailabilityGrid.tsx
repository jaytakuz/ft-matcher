import { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateTimeSlots, formatTimeSlot, formatDateHeader } from '@/lib/dateUtils';
import { getThaiHoliday, formatDateToYMD } from '@/lib/thaiHolidays';
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
  overlapFilter?: { min: number | null; max: number | null };
  timeSlotFilter?: { date: string; startTime: string; endTime: string } | null;
  showHolidays?: boolean;
}

const DAYS_PER_PAGE = 7;

export const AvailabilityGrid = ({
  event,
  currentUser,
  isEditMode,
  visualizationMode,
  selectedSlots,
  onSlotsChange,
  showOthersAvailability = true,
  overlapFilter,
  timeSlotFilter,
  showHolidays = false
}: AvailabilityGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<TimeSlot | null>(null);
  const [isAdding, setIsAdding] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const slotLength = event.slotLength || 30;
  const isDateOnly = event.dateOnly || false;
  const timeSlots = isDateOnly ? ['00:00'] : generateTimeSlots(event.startTime, event.endTime, slotLength);
  const allDates = event.dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const totalPages = Math.ceil(allDates.length / DAYS_PER_PAGE);
  const startIdx = currentPage * DAYS_PER_PAGE;
  const dates = allDates.slice(startIdx, startIdx + DAYS_PER_PAGE);

  const getSlotKey = (date: string, time: string) => `${date}-${time}`;

  const isSlotSelected = (date: string, time: string): boolean => {
    return selectedSlots.some(s => s.date === date && s.time === time);
  };

  const getAvailabilityCount = (date: string, time: string): number => {
    if (!showOthersAvailability) return 0;
    return event.availabilities.filter(a => a.slots.some(s => s.date === date && s.time === time)).length;
  };

  const getAvailableParticipants = (date: string, time: string): string[] => {
    if (!showOthersAvailability) return [];
    return event.availabilities.filter(a => a.slots.some(s => s.date === date && s.time === time)).map(a => a.participantName);
  };

  const getUnavailableParticipants = (date: string, time: string): string[] => {
    if (!showOthersAvailability) return [];
    const availableNames = new Set(
      event.availabilities
        .filter(a => a.slots.some(s => s.date === date && s.time === time))
        .map(a => a.participantName)
    );
    return event.availabilities
      .filter(a => !availableNames.has(a.participantName))
      .map(a => a.participantName);
  };

  const truncateName = (name: string, maxLen: number = 5): string => {
    return name.length > maxLen ? name.slice(0, maxLen) : name;
  };

  const totalParticipants = event.availabilities.length || 1;

  const isSlotInOverlapRange = (count: number): boolean => {
    if (!overlapFilter || (overlapFilter.min === null && overlapFilter.max === null)) {
      return true;
    }
    const min = overlapFilter.min ?? 0;
    const max = overlapFilter.max ?? totalParticipants;
    return count >= min && count <= max;
  };

  const isSlotInTimeRange = (dateStr: string, time: string): boolean => {
    if (!timeSlotFilter) return true;
    
    // Check if date matches
    if (dateStr !== timeSlotFilter.date) return false;
    
    // Check if time is within the range
    return time >= timeSlotFilter.startTime && time < timeSlotFilter.endTime;
  };

  const getHeatmapColor = (count: number, dateStr: string, time: string): string => {
    if (!showOthersAvailability) return 'bg-available-0';
    
    // Check if slot is outside the time slot filter range
    if (!isSlotInTimeRange(dateStr, time)) {
      return 'bg-muted/20'; // Dimmed/hidden appearance
    }
    
    // Check if slot is outside the overlap filter range
    if (!isSlotInOverlapRange(count)) {
      return 'bg-muted/20'; // Dimmed/hidden appearance
    }
    
    if (count === 0) return 'bg-available-0';
    const percentage = count / totalParticipants * 100;
    if (percentage <= 25) return 'bg-available-25';
    if (percentage <= 50) return 'bg-available-50';
    if (percentage <= 75) return 'bg-available-75';
    return 'bg-available-100';
  };

  const handleSlotInteraction = useCallback((date: string, time: string) => {
    if (!isEditMode) return;
    const slot: TimeSlot = { date, time };
    const isCurrentlySelected = isSlotSelected(date, time);
    if (!isDragging) {
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
    setDragStartSlot({ date, time });
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

  const handleTouchStart = (date: string, time: string, e: React.TouchEvent) => {
    if (!isEditMode) return;
    // Prevent default to stop vertical scrolling when selecting slots
    e.preventDefault();
    setIsDragging(true);
    const isCurrentlySelected = isSlotSelected(date, time);
    setIsAdding(!isCurrentlySelected);
    handleSlotInteraction(date, time);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isEditMode) return;
    // Prevent vertical scrolling during drag
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotData = element?.getAttribute('data-slot');
    if (slotData) {
      const [date, time] = slotData.split('|');
      handleSlotInteraction(date, time);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Pagination Header */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
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
        </div>
      )}

      <div ref={gridRef} className="flex overflow-x-auto" style={{ touchAction: isEditMode ? 'pan-x' : 'auto' }} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* Time column - sticky (hidden for date-only mode) */}
        {!isDateOnly && (
          <div className="sticky left-0 z-10 bg-card border-r border-border">
            <div className="h-16 border-b border-border" />
            {timeSlots.map(time => (
              <div key={time} className="h-8 px-2 text-xs text-muted-foreground border-b border-border min-w-[60px] flex items-start justify-end">
                {formatTimeSlot(time)}
              </div>
            ))}
          </div>
        )}

        {/* Date columns */}
        <div className="flex flex-1">
          {dates.map(date => {
            const dateStr = date.toISOString();
            const header = formatDateHeader(dateStr);
            const holiday = showHolidays ? getThaiHoliday(formatDateToYMD(date)) : undefined;
            
            return (
              <div key={dateStr} className="flex-1 min-w-[48px] sm:min-w-[56px]">
                {/* Date header */}
                <div className={cn(
                  "flex flex-col items-center justify-center border-b border-border px-1",
                  isDateOnly ? "h-20" : "h-16",
                  holiday && "bg-destructive/10"
                )}>
                  <span className={cn(
                    "text-[10px] uppercase",
                    holiday ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {header.day}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold",
                    holiday && "text-destructive"
                  )}>{header.date}</span>
                  <span className={cn(
                    "text-[10px]",
                    holiday ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {header.month}
                  </span>
                  {holiday && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[8px] text-destructive font-medium truncate max-w-full px-0.5">
                          🎉
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">{holiday.nameEn}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Time slots */}
                {timeSlots.map(time => {
                  const count = getAvailabilityCount(dateStr, time);
                  const isSelected = isSlotSelected(dateStr, time);
                  const participants = getAvailableParticipants(dateStr, time);
                  const unavailable = getUnavailableParticipants(dateStr, time);
                  const colorClass = isEditMode && isSelected ? 'bg-primary' : getHeatmapColor(count, dateStr, time);
                  
                  const slotContent = (
                    <div
                      data-slot={`${dateStr}|${time}`}
                      className={cn(
                        "border-b border-r border-border transition-colors",
                        isDateOnly ? "h-16" : "h-8",
                        colorClass,
                        isEditMode && "cursor-pointer hover:opacity-80",
                        isEditMode && isSelected && "ring-1 ring-primary-foreground/50 ring-inset"
                      )}
                      onMouseDown={() => handleMouseDown(dateStr, time)}
                      onMouseEnter={() => handleMouseEnter(dateStr, time)}
                      onTouchStart={(e) => handleTouchStart(dateStr, time, e)}
                    />
                  );

                  // Show tooltip when there are participants
                  if (participants.length > 0) {
                    const displayUnavailable = unavailable.slice(0, 5);
                    const hasMoreUnavailable = unavailable.length > 5;
                    
                    return (
                      <Tooltip key={getSlotKey(dateStr, time)}>
                        <TooltipTrigger asChild>
                          {slotContent}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="font-medium text-sm mb-1 text-destructive">
                            {unavailable.length} unavailable
                          </p>
                          {unavailable.length > 0 && (
                            <p className="text-xs text-foreground">
                              {displayUnavailable.map(n => truncateName(n)).join(', ')}
                              {hasMoreUnavailable && ` +${unavailable.length - 5}`}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <div key={getSlotKey(dateStr, time)}>{slotContent}</div>;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};