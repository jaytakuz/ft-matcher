// src/services/eventService.ts
import { supabase } from "@/integrations/supabase/client";

interface SaveAvailabilityParams {
  eventId: string;
  participantName: string;
  participantEmail?: string;
  slots: { date: string; time: string }[];
}

export const saveAvailability = async ({
  eventId,
  participantName,
  participantEmail,
  slots
}: SaveAvailabilityParams) => {
  
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
    return null;
  }

  // Insert new availability
  const { data: newAvail, error: insertError } = await supabase
    .from("availabilities")
    .insert({
      event_id: eventId,
      participant_id: crypto.randomUUID(),
      participant_name: participantName,
      participant_email: participantEmail || null,
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

  return newAvail;
};