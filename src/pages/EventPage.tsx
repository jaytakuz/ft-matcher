import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarCheck, Plus, Check, Users, ArrowLeft, Pencil, Eye, EyeOff, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { getEvent } from '@/lib/eventService'; 
import type { EventData, TimeSlot, RecommendedSlot } from '@/types/event';

// Import Supabase และ Token Utility
import { supabase } from "@/integrations/supabase/client"; 
import { getGuestToken } from '@/utils/guestToken';

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
  const [showHolidays, setShowHolidays] = useState(true);

  // 🟢 1. Logic ใหม่: ค้นหา Availability ของฉัน (รองรับทั้ง User และ Guest Token)
  const myAvailability = useMemo(() => {
    if (!event) return undefined;

    // A. ถ้า Login: เช็คจาก User ID
    if (supabaseUser) {
      return event.availabilities.find(a => a.userId === supabaseUser.id);
    }

    // B. ถ้า Guest: เช็คจาก Token ในเครื่อง
    const localToken = getGuestToken();
    return event.availabilities.find(a => a.guestToken === localToken);
  }, [event, supabaseUser]);

  // 🟢 2. Auto Load: ถ้าเจอข้อมูลเก่า (myAvailability) ให้โหลดมาใส่เลย
  useEffect(() => {
    if (myAvailability) {
      // โหลดเวลาเดิม
      setSelectedSlots(myAvailability.slots);

      // ถ้าเป็น Guest ให้โหลดชื่อเดิมมาใส่ด้วย (User Login มีชื่อใน metadata อยู่แล้ว)
      if (!supabaseUser) {
        setCurrentUser(myAvailability.participantName);
      }
    }
  }, [myAvailability, supabaseUser]);

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
    
    // Check if user already has availability (Fallback logic)
    const existingAvailability = event?.availabilities.find(
      a => a.participantName.toLowerCase() === name.toLowerCase()
    );
    
    if (existingAvailability) {
      setSelectedSlots(existingAvailability.slots);
    }
    
    setShowOthersAvailability(false);
    setIsEditMode(true);
  };

  const handleSaveAvailability = async () => {
    if (!event) return;

    const nameToSave = supabaseUser 
      ? (supabaseUser.user_metadata?.full_name || supabaseUser.email) 
      : currentUser;

    if (!nameToSave || (!nameToSave.trim())) {
      toast({ title: "Name required", variant: "destructive" });
      setShowParticipantForm(true);
      return;
    }

    setIsSaving(true);

    try {
      const userId = supabaseUser ? supabaseUser.id : null;
      const guestToken = !supabaseUser ? getGuestToken() : null;

      // 1. ลบข้อมูลเก่าทิ้ง (Logic ครอบคลุมทั้ง User และ Guest)
      let deleteQuery = supabase.from("availabilities").delete().eq("event_id", event.id);

      if (userId) {
        deleteQuery = deleteQuery.eq("user_id", userId);
      } else if (guestToken) {
        deleteQuery = deleteQuery.eq("guest_token", guestToken);
      }

      await deleteQuery;

      // 2. ถ้ามี slot ให้บันทึกใหม่
      if (selectedSlots.length > 0) {
        const { data: newAvail, error: insertError } = await supabase
          .from("availabilities")
          .insert({
            event_id: event.id,
            participant_id: crypto.randomUUID(),
            participant_name: nameToSave,
            user_id: userId || null,
            guest_token: userId ? null : guestToken,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        const slotsToInsert = selectedSlots.map((s) => ({
          availability_id: newAvail.id,
          date: s.date,
          time: s.time || s.startTime,
        }));

        const { error: slotsError } = await supabase.from("slots").insert(slotsToInsert);
        if (slotsError) throw slotsError;
      }

      // --- Success ---
      await loadEvent();
      setIsEditMode(false);
      setShowOthersAvailability(true);
      toast({ title: "Availability saved!", description: `Updated successfully.` });

    } catch (error) {
      console.error("Save Error:", error);
      toast({ title: "Error saving", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // ถ้าเป็น Guest และยังไม่ได้ Save (หรือ Cancel) อาจจะเคลียร์ค่า หรือถ้าอยากให้จำค่าไว้ก็ได้
    if (!supabaseUser && !myAvailability) {
        setSelectedSlots([]);
        setCurrentUser(null);
    } else if (myAvailability) {
        // ถ้า Cancel แต่มีข้อมูลเก่าอยู่แล้ว ให้โหลดข้อมูลเก่ากลับมา
        setSelectedSlots(myAvailability.slots);
    }
    setCurrentUserEmail(undefined);
    setShowOthersAvailability(true);
  };

  const handleOverlapFilterChange = (min: number | null, max: number | null) => {
    setOverlapFilter({ min, max });
  };
  const handleSelectTimeSlot = (slot: { date: string; startTime: string; endTime: string }) => {
    if (selectedTimeSlot && selectedTimeSlot.date === slot.date && selectedTimeSlot.startTime === slot.startTime) {
      setSelectedTimeSlot(null);
    } else {
      setSelectedTimeSlot(slot);
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleTopPickSelect = (slot: RecommendedSlot) => {
    handleSelectTimeSlot({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Loading...</div>;
  if (!event) return <div className="min-h-screen flex flex-col items-center justify-center">Event not found</div>;

  const sortedDates = event.dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange = sortedDates.length > 1
    ? `${format(sortedDates[0], 'MMM d')} - ${format(sortedDates[sortedDates.length - 1], 'MMM d, yyyy')}`
    : format(sortedDates[0], 'MMMM d, yyyy');

  const editingName = supabaseUser 
    ? (supabaseUser.user_metadata?.full_name || supabaseUser.email) 
    : currentUser;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{event.name}</h1>
              <p className="text-muted-foreground">Hosted by {event.hostName} • {dateRange}</p>
              {event.duration && (
                <Badge variant="secondary" className="mt-2">{event.duration} min event</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger> 
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
                        <li key={a.participantId} className="text-sm">{a.participantName}</li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <TopRecommendation event={event} onSelect={handleTopPickSelect} />
        </div>

        <div ref={gridRef} className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                
                {/* 🟢 3. ปุ่มฉลาดขึ้น: ถ้ายังไม่เคยลง (ทั้ง User/Guest) โชว์ Add */}
                {!isEditMode && !myAvailability && (
                  <Button variant="outline" size="sm" onClick={() => setShowParticipantForm(true)} className="gap-2">
                    <Pencil className="h-4 w-4" /> Add Availability
                  </Button>
                )}

                {/* 🟢 4. ถ้าเคยลงแล้ว (มี myAvailability) โชว์ Edit */}
                {!isEditMode && myAvailability && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => { 
                      setIsEditMode(true); 
                      setShowOthersAvailability(false); 
                    }} 
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" /> Edit My Availability
                  </Button>
                )}
                
                {showOthersAvailability ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <Label htmlFor="show-others" className="text-sm cursor-pointer">
                  {isEditMode ? "Show others' availability" : "Show all availability"}
                </Label>
                <Switch id="show-others" checked={showOthersAvailability} onCheckedChange={setShowOthersAvailability} />
              </div>
              <div className="flex items-center gap-3">
                {selectedTimeSlot && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTimeSlot(null)} className="text-xs">
                    Clear time filter
                  </Button>
                )}
                <Legend mode="heatmap" />
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-4">
              <div className="flex items-center gap-2 mt-1.5">
                <Switch id="show-holidays" checked={showHolidays} onCheckedChange={setShowHolidays} />
                <Label htmlFor="show-holidays" className="text-sm cursor-pointer">Show Holidays</Label>
              </div>
              {!isEditMode && event.availabilities.length > 0 && (
                <OverlapSlider event={event} onFilterChange={handleOverlapFilterChange} />
              )}
            </div>

            <AvailabilityGrid
              event={event}
              currentUser={editingName ?? undefined} 
              isEditMode={isEditMode}
              visualizationMode="heatmap"
              selectedSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
              showOthersAvailability={showOthersAvailability}
              overlapFilter={overlapFilter}
              timeSlotFilter={selectedTimeSlot}
              showHolidays={showHolidays}
            />

            {isEditMode && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSaveAvailability} variant="default" size="lg" disabled={isSaving}>
                  {isSaving ? "Saving..." : <><Check className="mr-2 h-4 w-4" /> Save Availability</>}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="lg">Cancel</Button>
                {editingName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                    <Pencil className="h-4 w-4" /> Editing as <span className="font-medium">{editingName}</span>
                  </div>
                )}
              </div>
            )}
            
            {isEditMode && <p className="text-sm text-muted-foreground">Click and drag to select times.</p>}
          </div>

          <aside className="space-y-4">
            <EventCodeDisplay eventId={event.id} />
            <AddToCalendarButton event={event} selectedSlot={firstRecommendation} />
            <RecommendedTimes event={event} onSelectTime={handleSelectTimeSlot} />
            <ParticipantsList participants={event.availabilities.map(a => a.participantName)} />
          </aside>
        </div>
      </main>

      <ParticipantForm
        open={showParticipantForm}
        onClose={() => setShowParticipantForm(false)}
        onSubmit={handleJoin}
        requireEmail={event.requireEmail}
      />
    </div>
  );
};

export default EventPage;