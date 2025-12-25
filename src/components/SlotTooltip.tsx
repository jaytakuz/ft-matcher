import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SlotTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  slotKey: string;
}

export const SlotTooltip = ({ children, content, slotKey }: SlotTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen(!open)}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="max-w-[200px] p-2"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};
