// Strict TypeScript interfaces for the Trip hierarchy

export interface Coordinates {
  lat: number;
  lng: number;
}

export type ActivityCategory = 
  | 'accommodation'
  | 'restaurant'
  | 'attraction'
  | 'transport'
  | 'activity'
  | 'shopping'
  | 'nightlife';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Activity {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  category: ActivityCategory;
  timeSlot: TimeSlot;
  mediaUrl?: string;
  duration?: number; // in minutes
  price?: number;
  rating?: number;
  address?: string;
}

export interface Day {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  days: Day[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  proposals?: ActivityProposal[];
}

export interface ActivityProposal {
  id: string;
  activity: Activity;
  suggestedDay?: number;
  reason?: string;
  isAdded: boolean;
}

export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bearing?: number;
  pitch?: number;
}
