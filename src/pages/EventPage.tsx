import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarCheck, 
  Plus, 
  Check, 
  Users,
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { RecommendedTimes } from '@/components/RecommendedTimes';
import { TopRecommendation } from '@/components/TopRecommendation';
import { ParticipantForm } from '@/components/ParticipantForm';
import { Legend } from '@/components/Legend';
import { EventCodeDisplay } from '@/components/EventCodeDisplay';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { OverlapSlider } from '@/components/OverlapSlider';
import { ParticipantsList } from '@/components/ParticipantsList';
import { getEvent, saveAvailability } from '@/lib/eventService';
import type { EventData, TimeSlot, Availability, RecommendedSlot } from '@/types/event';

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [copied, setCopied] = useState(false);
  const [showOthersAvailability, setShowOthersAvailability] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [overlapFilter, setOverlapFilter] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);

  // Calculate the first best time recommendation
  const firstRecommendation = useMemo((): RecommendedSlot | undefined => {
    if (!event || event.availabilities.length < 2) return undefined;
    
    const slotLength = event.slotLength || 30;
    const eventDuration = event.duration;
    
    const slotMap = new Map<string, Set<string>>();
    event.availabilities.forEach(availability => {
      availability.slots.forEach(slot => {
        const key = `${slot.date}|${slot.time}`;
        if (!slotMap.has(key)) slotMap.set(key, new Set());
        slotMap.get(key)!.add(availability.participantName);
      });
    });

    const recommendations: RecommendedSlot[] = [];
    const dates = [...new Set(event.availabilities.flatMap(a => a.slots.map(s => s.date)))].sort();
    const requiredSlots = eventDuration ? Math.ceil(eventDuration / slotLength) : null;

    const isConsecutiveTime = (t1: string, t2: string): boolean => {
      const [h1, m1] = t1.split(':').map(Number);
      const [h2, m2] = t2.split(':').map(Number);
      return (h2 * 60 + m2) - (h1 * 60 + m1) === slotLength;
    };

    const addMinutesToTime = (time: string, mins: number): string => {
      const [h, m] = time.split(':').map(Number);
      const total = h * 60 + m + mins;
      return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    dates.forEach(date => {
      const dateSlots = Array.from(slotMap.entries())
        .filter(([key]) => key.startsWith(date))
        .map(([key, participants]) => ({ time: key.split('|')[1], participants: Array.from(participants) }))
        .filter(s => s.participants.length >= 2)
        .sort((a, b) => a.time.localeCompare(b.time));

      let currentGroup: typeof dateSlots = [];
      dateSlots.forEach((slot, i) => {
        const prev = dateSlots[i - 1];
        const isContinuous = prev &&
          slot.participants.length === prev.participants.length &&
          slot.participants.every(p => prev.participants.includes(p)) &&
          isConsecutiveTime(prev.time, slot.time);

        if (!isContinuous && currentGroup.length > 0) {
          if (!requiredSlots || currentGroup.length >= requiredSlots) {
            const groupDuration = currentGroup.length * slotLength;
            let durationScore = groupDuration;
            if (requiredSlots) {
              const target = requiredSlots * slotLength;
              durationScore = groupDuration === target ? 500 : groupDuration > target ? 400 - (groupDuration - target) : groupDuration;
            }
            recommendations.push({
              date,
              startTime: currentGroup[0].time,
              endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, slotLength),
              participants: currentGroup[0].participants,
              score: currentGroup[0].participants.length * 1000 + durationScore,
            });
          }
          currentGroup = [];
        }
        currentGroup.push(slot);
      });

      if (currentGroup.length > 0 && (!requiredSlots || currentGroup.length >= requiredSlots)) {
        const groupDuration = currentGroup.length * slotLength;
        let durationScore = groupDuration;
        if (requiredSlots) {
          const target = requiredSlots * slotLength;
          durationScore = groupDuration === target ? 500 : groupDuration > target ? 400 - (groupDuration - target) : groupDuration;
        }
        recommendations.push({
          date,
          startTime: currentGroup[0].time,
          endTime: addMinutesToTime(currentGroup[currentGroup.length - 1].time, slotLength),
          participants: currentGroup[0].participants,
          score: currentGroup[0].participants.length * 1000 + durationScore,
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score)[0];
  }, [event]);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getEvent(id);
    if (error) {
      console.error("Error loading event:", error);
    }
    setEvent(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with your participants.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (name: string, email?: string) => {
    setCurrentUser(name);
    setCurrentUserEmail(email);
    setShowParticipantForm(false);
    
    // Check if user already has availability
    const existingAvailability = event?.availabilities.find(
      a => a.participantName.toLowerCase() === name.toLowerCase()
    );
    
    if (existingAvailability) {
      setSelectedSlots(existingAvailability.slots);
    } else {
      setSelectedSlots([]);
    }
    
    // Hide others' availability by default when entering edit mode
    setShowOthersAvailability(false);
    setIsEditMode(true);
  };

  const handleSaveAvailability = async () => {
    if (!event || !currentUser) return;

    setIsSaving(true);
    const { error } = await saveAvailability(event.id, currentUser, selectedSlots);

    if (error) {
      toast({
        title: "Error saving availability",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    // Reload event to get updated data
    await loadEvent();

    setIsEditMode(false);
    setShowOthersAvailability(true);
    setIsSaving(false);
    toast({
      title: "Availability saved!",
      description: `Your availability has been updated.`,
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedSlots([]);
    setCurrentUser(null);
    setCurrentUserEmail(undefined);
    // Show others' availability again after canceling
    setShowOthersAvailability(true);
  };

  const handleOverlapFilterChange = (min: number | null, max: number | null) => {
    setOverlapFilter({ min, max });
  };

  const handleSelectTimeSlot = (slot: { date: string; startTime: string; endTime: string }) => {
    // Toggle: if same slot is clicked, clear it
    if (selectedTimeSlot && selectedTimeSlot.date === slot.date && selectedTimeSlot.startTime === slot.startTime) {
      setSelectedTimeSlot(null);
    } else {
      setSelectedTimeSlot(slot);
      // Scroll to top of grid
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTopPickSelect = (slot: RecommendedSlot) => {
    handleSelectTimeSlot({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="text-muted-foreground">This event may have been deleted or the link is incorrect.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const sortedDates = event.dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange = sortedDates.length > 1
    ? `${format(sortedDates[0], 'MMM d')} - ${format(sortedDates[sortedDates.length - 1], 'MMM d, yyyy')}`
    : format(sortedDates[0], 'MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Freetime Matcher</span>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Event Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{event.name}</h1>
              <p className="text-muted-foreground">
                Hosted by {event.hostName} • {dateRange}
              </p>
              {event.duration && (
                <Badge variant="secondary" className="mt-2">
                  {event.duration < 60 ? `${event.duration} min` : `${event.duration / 60} hour${event.duration > 60 ? 's' : ''}`} event
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80 transition-colors">
                    <Users className="h-3 w-3" />
                    {event.availabilities.length} response{event.availabilities.length !== 1 ? 's' : ''}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="end">
                  <h4 className="font-medium text-sm mb-2">Respondents</h4>
                  {event.availabilities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No responses yet</p>
                  ) : (
                    <ul className="space-y-1">
                      {event.availabilities.map((a) => (
                        <li key={a.participantId} className="text-sm">
                          {a.participantName}
                        </li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Top Recommendation - only shows when 2+ participants have overlapping times */}
        <div className="mb-6">
          <TopRecommendation event={event} onSelect={handleTopPickSelect} />
        </div>

        <div ref={gridRef} className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Grid Section */}
          <div className="space-y-4">
            {/* Controls with Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                {!isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParticipantForm(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Add
                  </Button>
                )}
                {showOthersAvailability ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="show-others" className="text-sm cursor-pointer">
                  {isEditMode ? "Show others' availability" : "Show all availability"}
                </Label>
                <Switch
                  id="show-others"
                  checked={showOthersAvailability}
                  onCheckedChange={setShowOthersAvailability}
                />
              </div>
              <div className="flex items-center gap-3">
                {selectedTimeSlot && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTimeSlot(null)}
                    className="text-xs"
                  >
                    Clear time filter
                  </Button>
                )}
                <Legend mode="heatmap" />
              </div>
            </div>

            {/* Overlap Slider Filter */}
            {!isEditMode && event.availabilities.length > 0 && (
              <OverlapSlider 
                event={event} 
                onFilterChange={handleOverlapFilterChange} 
              />
            )}

            {/* Grid */}
            <AvailabilityGrid
              event={event}
              currentUser={currentUser ?? undefined}
              isEditMode={isEditMode}
              visualizationMode="heatmap"
              selectedSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
              showOthersAvailability={showOthersAvailability}
              overlapFilter={overlapFilter}
              timeSlotFilter={selectedTimeSlot}
            />

            {/* Action Buttons */}
            {isEditMode && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSaveAvailability} size="lg" className="flex-1 sm:flex-none" disabled={isSaving}>
                  {isSaving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Availability
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="lg">
                  Cancel
                </Button>
                {currentUser && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                    <Pencil className="h-4 w-4" />
                    Editing as <span className="font-medium text-foreground">{currentUser}</span>
                  </div>
                )}
              </div>
            )}

            {isEditMode && (
              <p className="text-sm text-muted-foreground">
                Click and drag on the grid to select your available times. Selected slots are highlighted in green.
              </p>
            )}
          </div>

          {/* Sidebar - Participants & Best Times */}
          <aside className="space-y-4">
            {/* Event Code Display */}
            <EventCodeDisplay eventId={event.id} />

            {/* Add to Calendar Button */}
            <AddToCalendarButton event={event} selectedSlot={firstRecommendation} />

            {/* Best Times List */}
            <RecommendedTimes event={event} onSelectTime={handleSelectTimeSlot} />

            {/* Participants List */}
            <ParticipantsList participants={event.availabilities.map(a => a.participantName)} />
          </aside>
        </div>
      </main>

      <ParticipantForm
        open={showParticipantForm}
        onClose={() => setShowParticipantForm(false)}
        onSubmit={handleJoin}
      />
    </div>
  );
};

export default EventPage;