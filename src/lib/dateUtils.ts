import { format, parse, addMinutes, isBefore, isAfter, startOfDay, addDays, getYear, setYear } from 'date-fns';

export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = [];
  const baseDate = new Date(2000, 0, 1);

  const start = parse(startTime, "HH:mm", baseDate);

  // Radix Select needs non-empty values; also `date-fns/parse` doesn't accept 24:00.
  // Treat "24:00" as end-of-day (exclusive), i.e. next day at 00:00.
  const end =
    endTime === "24:00"
      ? addDays(startOfDay(baseDate), 1)
      : parse(endTime, "HH:mm", baseDate);

  let current = start;

  while (isBefore(current, end)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
};

export const formatTimeSlot = (time: string): string => {
  const baseDate = new Date(2000, 0, 1);
  const parsed = parse(time, 'HH:mm', baseDate);
  return format(parsed, 'h:mm a');
};

export const formatDateHeader = (dateStr: string): { day: string; date: string; month: string } => {
  const date = new Date(dateStr);
  return {
    day: format(date, 'EEE'),
    date: format(date, 'd'),
    month: format(date, 'MMM'),
  };
};

export const inferYear = (month: number): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // If selected month is earlier in the year than current month,
  // assume next year
  if (month < currentMonth) {
    return currentYear + 1;
  }
  return currentYear;
};

export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);
  
  while (!isAfter(current, end)) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  
  return dates;
};

export const generateEventId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
