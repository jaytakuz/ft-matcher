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

  const handleMouseDown = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled?.(date)) return;
    
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || disabled?.(date)) return;
    setDragEnd(date);
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
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
  };

  const handleClick = (date: Date) => {
    if (disabled?.(date)) return;
    
    if (isDateSelected(date)) {
      onSelect(selected.filter(d => !isSameDay(d, date)));
    } else {
      onSelect([...selected, date]);
    }
  };

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
                  className={cn(
                    "h-9 w-9 flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors",
                    !isCurrentMonth && "opacity-50 text-muted-foreground",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    isToday && !isSelected && "bg-accent text-accent-foreground",
                    isSelected && "bg-primary text-primary-foreground",
                    isInRange && !isSelected && "bg-primary/50 text-primary-foreground",
                    !isSelected && !isInRange && !isToday && isCurrentMonth && !isDisabled && 
                      "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onMouseDown={(e) => handleMouseDown(day, e)}
                  onMouseEnter={() => handleMouseEnter(day)}
                  onClick={() => !isDragging && handleClick(day)}
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
