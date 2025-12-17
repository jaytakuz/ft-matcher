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
  availabilities: Availability[];
  createdAt: string;
}

export interface RecommendedSlot {
  date: string;
  startTime: string;
  endTime: string;
  participants: string[];
  score: number;
}

export type VisualizationMode = 'heatmap' | 'traffic';
