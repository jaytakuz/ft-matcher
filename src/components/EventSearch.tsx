import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getEventByCode } from '@/lib/eventService';
import { useToast } from '@/hooks/use-toast';

export const EventSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventCode, setEventCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim()) return;

    setIsSearching(true);
    const { data, error } = await getEventByCode(eventCode.trim());

    if (error || !data) {
      toast({
        title: "Event not found",
        description: "Please check the event code and try again.",
        variant: "destructive",
      });
      setIsSearching(false);
      return;
    }

    navigate(`/event/${eventCode.trim()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value.toLowerCase())}
          placeholder="Enter event code..."
          className="pl-10"
        />
      </div>
      <Button type="submit" disabled={!eventCode.trim() || isSearching} size="default">
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Join
            <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
};