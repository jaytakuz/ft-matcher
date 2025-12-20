import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarCheck, 
  Share2, 
  Plus, 
  Check, 
  Users,
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { RecommendedTimes } from '@/components/RecommendedTimes';
import { ParticipantForm } from '@/components/ParticipantForm';
import { Legend } from '@/components/Legend';
import type { EventData, TimeSlot, VisualizationMode, Availability } from '@/types/event';

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [copied, setCopied] = useState(false);
  const [showOthersAvailability, setShowOthersAvailability] = useState(true);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`event-${id}`);
      if (stored) {
        setEvent(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, [id]);

  const saveEvent = (updatedEvent: EventData) => {
    localStorage.setItem(`event-${updatedEvent.id}`, JSON.stringify(updatedEvent));
    setEvent(updatedEvent);
  };

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

  const handleJoin = (name: string) => {
    setCurrentUser(name);
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
    
    setIsEditMode(true);
  };

  const handleSaveAvailability = () => {
    if (!event || !currentUser) return;

    const updatedAvailabilities = event.availabilities.filter(
      a => a.participantName.toLowerCase() !== currentUser.toLowerCase()
    );

    if (selectedSlots.length > 0) {
      const newAvailability: Availability = {
        participantId: crypto.randomUUID(),
        participantName: currentUser,
        slots: selectedSlots,
      };
      updatedAvailabilities.push(newAvailability);
    }

    saveEvent({
      ...event,
      availabilities: updatedAvailabilities,
    });

    setIsEditMode(false);
    toast({
      title: "Availability saved!",
      description: `Your availability has been updated.`,
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedSlots([]);
    setCurrentUser(null);
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
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
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
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.availabilities.length} response{event.availabilities.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>

        {/* Top Recommendation Section */}
        <div className="mb-6">
          <RecommendedTimes event={event} />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Grid Section */}
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                {showOthersAvailability ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="show-others" className="text-sm cursor-pointer">
                  Show others' availability
                </Label>
                <Switch
                  id="show-others"
                  checked={showOthersAvailability}
                  onCheckedChange={setShowOthersAvailability}
                />
              </div>
              <Legend mode="heatmap" />
            </div>

            {/* Grid */}
            <AvailabilityGrid
              event={event}
              currentUser={currentUser ?? undefined}
              isEditMode={isEditMode}
              visualizationMode="heatmap"
              selectedSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
              showOthersAvailability={showOthersAvailability}
            />

            {/* Action Button */}
            {!isEditMode ? (
              <Button
                onClick={() => setShowParticipantForm(true)}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your Availability
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSaveAvailability} size="lg" className="flex-1 sm:flex-none">
                  <Check className="mr-2 h-4 w-4" />
                  Save Availability
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

          {/* Sidebar - Participants */}
          <aside className="space-y-4">
            {/* Participants List */}
            {event.availabilities.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Participants
                </h3>
                <div className="space-y-2">
                  {event.availabilities.map((a) => (
                    <div
                      key={a.participantId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{a.participantName}</span>
                      <span className="text-muted-foreground">
                        {a.slots.length} slot{a.slots.length !== 1 ? 's' : ''}
                      </span>
                    </div>
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