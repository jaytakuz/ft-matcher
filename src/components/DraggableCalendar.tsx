import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, startOfWeek, endOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DraggableCalendarProps {
  selected: Date[];
  onSelect: (dates: Date[]) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function DraggableCalendar({ 
  selected, 
  onSelect, 
  disabled,
  className 
}: DraggableCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateSelected = useCallback((date: Date) => {
    return selected.some(d => isSameDay(d, date));
  }, [selected]);

  const isInDragRange = useCallback((date: Date) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const start = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
    const end = isAfter(dragStart, dragEnd) ? dragStart : dragEnd;
    return (isSameDay(date, start) || isAfter(date, start)) && 
           (isSameDay(date, end) || isBefore(date, end));
  }, [isDragging, dragStart, dragEnd]);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDragRef = useRef(false);

  const handleMouseDown = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled?.(date)) return;
    
    // Store initial position to detect actual drag vs click
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isDragRef.current = false;
    
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
  };

  const handleMouseEnter = (date: Date, e: React.MouseEvent) => {
    if (!isDragging || disabled?.(date)) return;
    
    // If mouse moved significantly, mark as actual drag
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      if (dx > 5 || dy > 5) {
        isDragRef.current = true;
      }
    }
    
    setDragEnd(date);
  };

  const handleMouseUp = (date?: Date) => {
    if (!isDragging) {
      return;
    }

    // If this was a click (not a drag), toggle the single date
    if (!isDragRef.current && date && !disabled?.(date)) {
      if (isDateSelected(date)) {
        onSelect(selected.filter(d => !isSameDay(d, date)));
      } else {
        onSelect([...selected, date]);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      dragStartRef.current = null;
      return;
    }

    // Handle drag range selection
    if (!dragStart || !dragEnd) {
      setIsDragging(false);
      dragStartRef.current = null;
      return;
    }

    const start = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
    const end = isAfter(dragStart, dragEnd) ? dragStart : dragEnd;
    const rangeDates = eachDayOfInterval({ start, end }).filter(d => !disabled?.(d));

    // Toggle selection: if all dates in range are selected, remove them; otherwise add them
    const allSelected = rangeDates.every(d => isDateSelected(d));
    
    let newSelection: Date[];
    if (allSelected) {
      // Remove all dates in range
      newSelection = selected.filter(d => !rangeDates.some(rd => isSameDay(rd, d)));
    } else {
      // Add dates not already selected
      const toAdd = rangeDates.filter(d => !isDateSelected(d));
      newSelection = [...selected, ...toAdd];
    }

    onSelect(newSelection);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    dragStartRef.current = null;
  };

  // Touch handlers for mobile support
  const touchStartRef = useRef<{ x: number; y: number; date: Date } | null>(null);
  const isTouchDragRef = useRef(false);

  const handleTouchStart = (date: Date, e: React.TouchEvent) => {
    if (disabled?.(date)) return;
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, date };
    isTouchDragRef.current = false;
    
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    
    if (dx > 10 || dy > 10) {
      isTouchDragRef.current = true;
      e.preventDefault(); // Prevent scroll when dragging
    }
    
    // Find which date element we're over
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dateAttr = element?.getAttribute('data-date');
    if (dateAttr) {
      const targetDate = new Date(dateAttr);
      if (!disabled?.(targetDate)) {
        setDragEnd(targetDate);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const date = touchStartRef.current?.date;
    
    // If this was a tap (not a drag), toggle the single date
    if (!isTouchDragRef.current && date && !disabled?.(date)) {
      if (isDateSelected(date)) {
        onSelect(selected.filter(d => !isSameDay(d, date)));
      } else {
        onSelect([...selected, date]);
      }
    } else if (isTouchDragRef.current && dragStart && dragEnd) {
      // Handle drag range selection
      const start = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
      const end = isAfter(dragStart, dragEnd) ? dragStart : dragEnd;
      const rangeDates = eachDayOfInterval({ start, end }).filter(d => !disabled?.(d));

      const allSelected = rangeDates.every(d => isDateSelected(d));
      
      let newSelection: Date[];
      if (allSelected) {
        newSelection = selected.filter(d => !rangeDates.some(rd => isSameDay(rd, d)));
      } else {
        const toAdd = rangeDates.filter(d => !isDateSelected(d));
        newSelection = [...selected, ...toAdd];
      }

      onSelect(newSelection);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    touchStartRef.current = null;
    isTouchDragRef.current = false;
  };

  // Click is now handled in handleMouseUp when isDragRef.current is false

  // Handle mouse up outside the calendar
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd, selected]);

  return (
    <div 
      ref={containerRef}
      className={cn("p-3 select-none", className)}
      onMouseLeave={() => {
        if (isDragging) {
          // Keep the drag going even if mouse leaves
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <Button
          variant="outline"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="outline"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="flex mb-2">
        {weekDays.map(day => (
          <div 
            key={day} 
            className="w-9 text-center text-muted-foreground text-[0.8rem] font-normal"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex">
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isDateSelected(day);
              const isDisabled = disabled?.(day);
              const isInRange = isInDragRange(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dayIndex}
                  data-date={day.toISOString()}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors touch-none",
                    !isCurrentMonth && "opacity-50 text-muted-foreground",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    isSelected && "bg-primary text-primary-foreground",
                    isInRange && !isSelected && "bg-primary/50 text-primary-foreground",
                    isToday && !isSelected && !isInRange && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    !isSelected && !isInRange && !isToday && isCurrentMonth && !isDisabled && 
                      "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onMouseDown={(e) => handleMouseDown(day, e)}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseUp={() => handleMouseUp(day)}
                  onTouchStart={(e) => handleTouchStart(day, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Click or drag to select multiple dates
      </p>
    </div>
  );
}
