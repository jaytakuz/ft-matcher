export interface TimeSlot {
  date: string; // ISO date string
  time: string; // HH:mm format
}

export interface Availability {
  participantId: string;
  participantName: string;
  slots: TimeSlot[];
}

export interface EventData {
  id: string;
  name: string;
  hostName: string;
  hostEmail?: string;
  dates: string[]; // ISO date strings
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration?: number; // event duration in minutes
  slotLength?: number; // slot length in minutes (default 30)
  dateOnly?: boolean; // true = dates only mode, false = dates and times mode
  requireEmail?: boolean; // true = participants must provide email
  availabilities: Availability[];
  createdAt: string;
}

export interface ParticipantInfo {
  name: string;
  email?: string;
}

export interface RecommendedSlot {
  date: string;
  startTime: string;
  endTime: string;
  participants: string[];
  score: number;
  time: string;
}

export type VisualizationMode = 'heatmap';
