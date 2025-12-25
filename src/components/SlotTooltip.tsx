import { useState, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SlotTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  slotKey: string;
}

export const SlotTooltip = ({ children, content, slotKey }: SlotTooltipProps) => {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 300); // 300ms delay before showing
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 100); // small delay before closing
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle on click for touch devices (detected by checking if it's a touch event)
    setOpen(prev => !prev);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleTouchStart}
          onClick={handleClick}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="max-w-[200px] p-2"
        onMouseEnter={() => {
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};
