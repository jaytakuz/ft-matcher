import { useState, useEffect, useCallback, useRef } from 'react';
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
import { getEvent, saveAvailability } from '@/lib/eventService';
import type { EventData, TimeSlot, Availability } from '@/types/event';

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
  const [filterParticipant, setFilterParticipant] = useState<string | null>(null);

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
    setFilterParticipant(null);
  };

  const handleParticipantClick = (participantName: string) => {
    // Toggle filter: if same name clicked, clear filter
    if (filterParticipant === participantName) {
      setFilterParticipant(null);
    } else {
      setFilterParticipant(participantName);
      // Scroll to top of grid
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Create filtered event data when filtering by participant
  const filteredEvent = filterParticipant && event ? {
    ...event,
    availabilities: event.availabilities.filter(a => a.participantName === filterParticipant)
  } : event;

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
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
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
          <TopRecommendation event={event} />
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
                    Edit
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
                {filterParticipant && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterParticipant(null)}
                    className="text-xs"
                  >
                    Clear filter: {filterParticipant}
                  </Button>
                )}
                <Legend mode="heatmap" />
              </div>
            </div>

            {/* Grid */}
            <AvailabilityGrid
              event={filteredEvent!}
              currentUser={currentUser ?? undefined}
              isEditMode={isEditMode}
              visualizationMode="heatmap"
              selectedSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
              showOthersAvailability={showOthersAvailability}
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
            <AddToCalendarButton event={event} />

            {/* Best Times List */}
            <RecommendedTimes event={event} />

            {/* Participants List */}
            {event.availabilities.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Participants
                </h3>
                <div className="space-y-2">
                  {event.availabilities.map((a) => (
                    <button
                      key={a.participantId}
                      onClick={() => handleParticipantClick(a.participantName)}
                      className={`w-full flex items-center justify-between text-sm p-2 rounded-md transition-colors hover:bg-muted/50 ${
                        filterParticipant === a.participantName ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span>{a.participantName}</span>
                      <span className="text-muted-foreground">
                        {a.slots.length} slot{a.slots.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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