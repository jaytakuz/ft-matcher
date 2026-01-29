// src/services/eventService.ts

// 1. อัปเดต Interface ของพารามิเตอร์ (ถ้ามี)
interface SaveAvailabilityParams {
  eventId: string;
  userEmail?: string;     // อันเดิมของคุณอาจจะเป็น userEmail หรือ userId
  userId?: string | null; // ✅ เพิ่ม: รับ userId (อาจเป็น null ได้)
  guestToken?: string | null; // ✅ เพิ่ม: รับ guestToken
  participantName: string;
  slots: any[];           // Type ของ slot เวลาที่คุณใช้
}

export const saveAvailability = async ({
  eventId,
  userId,
  guestToken,
  participantName,
  slots
}: SaveAvailabilityParams) => {
  
  // แปลงข้อมูล Slot ให้เป็น format ของ Supabase
  const availabilityData = slots.map((slot) => ({
    event_id: eventId,
    start_time: slot.start, // ปรับตาม structure จริงของคุณ
    end_time: slot.end,     // ปรับตาม structure จริงของคุณ
    
    // 🟢 Logic หัวใจสำคัญ:
    // ถ้ามี userId -> ใส่ userId, guest_token เป็น null
    // ถ้าไม่มี userId -> ใส่ null, guest_token เป็นค่าที่ส่งมา
    user_id: userId || null,
    guest_token: userId ? null : guestToken,
    
    participant_name: participantName,
  }));

  // ยิง insert ทีเดียว
  const { data, error } = await supabase
    .from('availabilities')
    .insert(availabilityData);

  if (error) {
    console.error('Error saving availability:', error);
    throw error;
  }

  return data;
};