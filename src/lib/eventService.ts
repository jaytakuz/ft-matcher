import { supabase } from "@/integrations/supabase/client";
import type { EventData, Availability, TimeSlot } from "@/types/event";

export async function createEvent(eventData: Omit<EventData, 'availabilities'>): Promise<{ data: EventData | null; error: Error | null }> {
  try {
    const { error } = await supabase.from("events").insert({
      id: eventData.id,
      name: eventData.name,
      host_name: eventData.hostName,
      host_email: eventData.hostEmail || null,
      dates: eventData.dates,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      duration: eventData.duration || null,
    });

    if (error) throw error;

    return { 
      data: { ...eventData, availabilities: [] }, 
      error: null 
    };
  } catch (err) {
    console.error("Error creating event:", err);
    return { data: null, error: err as Error };
  }
}

export async function getEvent(id: string): Promise<{ data: EventData | null; error: Error | null }> {
  try {
    // Fetch event
    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!eventRow) return { data: null, error: null };

    // Fetch availabilities with slots
    const { data: availabilityRows, error: availError } = await supabase
      .from("availabilities")
      .select(`
        id,
        participant_id,
        participant_name,
        slots (
          date,
          time
        )
      `)
      .eq("event_id", id);

    if (availError) throw availError;

    const availabilities: Availability[] = (availabilityRows || []).map((a) => ({
      participantId: a.participant_id,
      participantName: a.participant_name,
      slots: (a.slots || []).map((s: { date: string; time: string }) => ({
        date: s.date,
        time: s.time,
      })),
    }));

    const eventData: EventData = {
      id: eventRow.id,
      name: eventRow.name,
      hostName: eventRow.host_name,
      hostEmail: eventRow.host_email || undefined,
      dates: eventRow.dates,
      startTime: eventRow.start_time,
      endTime: eventRow.end_time,
      duration: eventRow.duration || undefined,
      availabilities,
      createdAt: eventRow.created_at,
    };

    return { data: eventData, error: null };
  } catch (err) {
    console.error("Error fetching event:", err);
    return { data: null, error: err as Error };
  }
}

export async function saveAvailability(
  eventId: string,
  participantName: string,
  slots: TimeSlot[]
): Promise<{ error: Error | null }> {
  try {
    // Delete existing availability for this participant
    const { data: existing } = await supabase
      .from("availabilities")
      .select("id")
      .eq("event_id", eventId)
      .ilike("participant_name", participantName)
      .maybeSingle();

    if (existing) {
      await supabase.from("availabilities").delete().eq("id", existing.id);
    }

    if (slots.length === 0) {
      return { error: null };
    }

    // Insert new availability
    const { data: newAvail, error: insertError } = await supabase
      .from("availabilities")
      .insert({
        event_id: eventId,
        participant_id: crypto.randomUUID(),
        participant_name: participantName,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Insert slots
    const slotsToInsert = slots.map((s) => ({
      availability_id: newAvail.id,
      date: s.date,
      time: s.time,
    }));

    const { error: slotsError } = await supabase
      .from("slots")
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;

    return { error: null };
  } catch (err) {
    console.error("Error saving availability:", err);
    return { error: err as Error };
  }
}
