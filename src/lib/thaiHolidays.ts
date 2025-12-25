// Thai public holidays for 2024-2026
// This list includes major Thai public holidays

export interface ThaiHoliday {
  date: string; // Format: YYYY-MM-DD
  name: string;
  nameEn: string;
}

const holidays: ThaiHoliday[] = [
  // 2024
  { date: '2024-01-01', name: 'วันขึ้นปีใหม่', nameEn: "New Year's Day" },
  { date: '2024-02-24', name: 'วันมาฆบูชา', nameEn: 'Makha Bucha Day' },
  { date: '2024-04-06', name: 'วันจักรี', nameEn: 'Chakri Memorial Day' },
  { date: '2024-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2024-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2024-04-15', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2024-05-01', name: 'วันแรงงาน', nameEn: 'Labour Day' },
  { date: '2024-05-04', name: 'วันฉัตรมงคล', nameEn: 'Coronation Day' },
  { date: '2024-05-22', name: 'วันวิสาขบูชา', nameEn: 'Visakha Bucha Day' },
  { date: '2024-06-03', name: 'วันเฉลิมพระชนมพรรษา ร.10', nameEn: "Queen's Birthday" },
  { date: '2024-07-20', name: 'วันอาสาฬหบูชา', nameEn: 'Asalha Bucha Day' },
  { date: '2024-07-21', name: 'วันเข้าพรรษา', nameEn: 'Buddhist Lent Day' },
  { date: '2024-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', nameEn: "King's Birthday" },
  { date: '2024-08-12', name: 'วันแม่แห่งชาติ', nameEn: "Mother's Day" },
  { date: '2024-10-13', name: 'วันคล้ายวันสวรรคต ร.9', nameEn: 'King Bhumibol Memorial Day' },
  { date: '2024-10-23', name: 'วันปิยมหาราช', nameEn: 'Chulalongkorn Day' },
  { date: '2024-12-05', name: 'วันพ่อแห่งชาติ', nameEn: "Father's Day" },
  { date: '2024-12-10', name: 'วันรัฐธรรมนูญ', nameEn: 'Constitution Day' },
  { date: '2024-12-31', name: 'วันสิ้นปี', nameEn: "New Year's Eve" },

  // 2025
  { date: '2025-01-01', name: 'วันขึ้นปีใหม่', nameEn: "New Year's Day" },
  { date: '2025-02-12', name: 'วันมาฆบูชา', nameEn: 'Makha Bucha Day' },
  { date: '2025-04-06', name: 'วันจักรี', nameEn: 'Chakri Memorial Day' },
  { date: '2025-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2025-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2025-04-15', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2025-05-01', name: 'วันแรงงาน', nameEn: 'Labour Day' },
  { date: '2025-05-04', name: 'วันฉัตรมงคล', nameEn: 'Coronation Day' },
  { date: '2025-05-11', name: 'วันวิสาขบูชา', nameEn: 'Visakha Bucha Day' },
  { date: '2025-06-03', name: 'วันเฉลิมพระชนมพรรษา', nameEn: "Queen's Birthday" },
  { date: '2025-07-10', name: 'วันอาสาฬหบูชา', nameEn: 'Asalha Bucha Day' },
  { date: '2025-07-11', name: 'วันเข้าพรรษา', nameEn: 'Buddhist Lent Day' },
  { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', nameEn: "King's Birthday" },
  { date: '2025-08-12', name: 'วันแม่แห่งชาติ', nameEn: "Mother's Day" },
  { date: '2025-10-13', name: 'วันคล้ายวันสวรรคต ร.9', nameEn: 'King Bhumibol Memorial Day' },
  { date: '2025-10-23', name: 'วันปิยมหาราช', nameEn: 'Chulalongkorn Day' },
  { date: '2025-12-05', name: 'วันพ่อแห่งชาติ', nameEn: "Father's Day" },
  { date: '2025-12-10', name: 'วันรัฐธรรมนูญ', nameEn: 'Constitution Day' },
  { date: '2025-12-31', name: 'วันสิ้นปี', nameEn: "New Year's Eve" },

  // 2026
  { date: '2026-01-01', name: 'วันขึ้นปีใหม่', nameEn: "New Year's Day" },
  { date: '2026-03-03', name: 'วันมาฆบูชา', nameEn: 'Makha Bucha Day' },
  { date: '2026-04-06', name: 'วันจักรี', nameEn: 'Chakri Memorial Day' },
  { date: '2026-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-04-15', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-05-01', name: 'วันแรงงาน', nameEn: 'Labour Day' },
  { date: '2026-05-04', name: 'วันฉัตรมงคล', nameEn: 'Coronation Day' },
  { date: '2026-05-31', name: 'วันวิสาขบูชา', nameEn: 'Visakha Bucha Day' },
  { date: '2026-06-03', name: 'วันเฉลิมพระชนมพรรษา', nameEn: "Queen's Birthday" },
  { date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', nameEn: "King's Birthday" },
  { date: '2026-07-29', name: 'วันอาสาฬหบูชา', nameEn: 'Asalha Bucha Day' },
  { date: '2026-07-30', name: 'วันเข้าพรรษา', nameEn: 'Buddhist Lent Day' },
  { date: '2026-08-12', name: 'วันแม่แห่งชาติ', nameEn: "Mother's Day" },
  { date: '2026-10-13', name: 'วันคล้ายวันสวรรคต ร.9', nameEn: 'King Bhumibol Memorial Day' },
  { date: '2026-10-23', name: 'วันปิยมหาราช', nameEn: 'Chulalongkorn Day' },
  { date: '2026-12-05', name: 'วันพ่อแห่งชาติ', nameEn: "Father's Day" },
  { date: '2026-12-10', name: 'วันรัฐธรรมนูญ', nameEn: 'Constitution Day' },
  { date: '2026-12-31', name: 'วันสิ้นปี', nameEn: "New Year's Eve" },
];

export function getThaiHoliday(dateStr: string): ThaiHoliday | undefined {
  // Extract YYYY-MM-DD from ISO string or use as-is
  const normalizedDate = dateStr.split('T')[0];
  return holidays.find(h => h.date === normalizedDate);
}

export function isThaiHoliday(dateStr: string): boolean {
  return getThaiHoliday(dateStr) !== undefined;
}

export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
