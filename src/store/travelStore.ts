import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Trip, Day, Activity, ChatMessage, ActivityProposal, MapViewState, Coordinates } from '@/types/trip';

interface TravelState {
  // Active itinerary slice
  activeItinerary: Trip | null;
  
  // Chat slice
  messages: ChatMessage[];
  isTyping: boolean;
  
  // Map slice
  mapViewState: MapViewState;
  selectedActivityId: string | null;
  hoveredActivityId: string | null;
  
  // UI state
  mobileView: 'chat' | 'map' | 'itinerary';
  
  // Actions
  setActiveItinerary: (trip: Trip | null) => void;
  addDay: (day: Day) => void;
  removeDay: (dayId: string) => void;
  updateDay: (dayId: string, updates: Partial<Day>) => void;
  
  addActivity: (dayId: string, activity: Activity) => void;
  removeActivity: (dayId: string, activityId: string) => void;
  updateActivity: (dayId: string, activityId: string, updates: Partial<Activity>) => void;
  moveActivity: (fromDayId: string, toDayId: string, activityId: string) => void;
  
  addMessage: (message: ChatMessage) => void;
  setIsTyping: (isTyping: boolean) => void;
  markProposalAsAdded: (messageId: string, proposalId: string) => void;
  
  setMapViewState: (viewState: Partial<MapViewState>) => void;
  flyToCoordinates: (coordinates: Coordinates, zoom?: number) => void;
  setSelectedActivity: (activityId: string | null) => void;
  setHoveredActivity: (activityId: string | null) => void;
  
  setMobileView: (view: 'chat' | 'map' | 'itinerary') => void;
  
  // Derived selectors
  getAllActivities: () => Activity[];
  getActivityById: (id: string) => Activity | undefined;
}

// Sample data for demonstration
const sampleTrip: Trip = {
  id: 'trip-1',
  name: 'Mediterranean Adventure',
  destination: 'Amalfi Coast, Italy',
  startDate: '2024-06-15',
  endDate: '2024-06-22',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  days: [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2024-06-15',
      title: 'Arrival in Positano',
      activities: [
        {
          id: 'act-1',
          name: 'Hotel Le Sirenuse',
          description: 'Luxury boutique hotel with stunning sea views',
          coordinates: { lat: 40.6281, lng: 14.4850 },
          category: 'accommodation',
          timeSlot: 'afternoon',
          mediaUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
          rating: 4.9,
          address: 'Via Cristoforo Colombo, 30, Positano'
        },
        {
          id: 'act-2',
          name: 'Dinner at La Sponda',
          description: 'Romantic candlelit dinner with Mediterranean cuisine',
          coordinates: { lat: 40.6285, lng: 14.4855 },
          category: 'restaurant',
          timeSlot: 'evening',
          duration: 120,
          price: 150,
          rating: 4.8
        }
      ]
    },
    {
      id: 'day-2',
      dayNumber: 2,
      date: '2024-06-16',
      title: 'Exploring Amalfi',
      activities: [
        {
          id: 'act-3',
          name: 'Amalfi Cathedral',
          description: 'Visit the stunning 9th-century cathedral',
          coordinates: { lat: 40.6340, lng: 14.6027 },
          category: 'attraction',
          timeSlot: 'morning',
          duration: 90,
          rating: 4.7
        },
        {
          id: 'act-4',
          name: 'Boat Tour to Grotta dello Smeraldo',
          description: 'Explore the famous Emerald Grotto by boat',
          coordinates: { lat: 40.6178, lng: 14.5333 },
          category: 'activity',
          timeSlot: 'afternoon',
          duration: 180,
          price: 75,
          rating: 4.6
        }
      ]
    },
    {
      id: 'day-3',
      dayNumber: 3,
      date: '2024-06-17',
      title: 'Ravello & Relaxation',
      activities: [
        {
          id: 'act-5',
          name: 'Villa Rufolo Gardens',
          description: 'Stunning gardens with panoramic coastal views',
          coordinates: { lat: 40.6492, lng: 14.6117 },
          category: 'attraction',
          timeSlot: 'morning',
          duration: 120,
          price: 10,
          rating: 4.8
        }
      ]
    }
  ]
};

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Welcome to Nomaaad! 🌍 I'm your AI travel companion. I've prepared a beautiful Mediterranean itinerary for you. Feel free to ask me to modify anything, add new activities, or get recommendations!",
    timestamp: new Date().toISOString()
  }
];

export const useTravelStore = create<TravelState>()(
  immer((set, get) => ({
    activeItinerary: sampleTrip,
    messages: initialMessages,
    isTyping: false,
    mapViewState: {
      center: { lat: 40.6340, lng: 14.6027 },
      zoom: 11
    },
    selectedActivityId: null,
    hoveredActivityId: null,
    mobileView: 'chat',
    
    setActiveItinerary: (trip) => set({ activeItinerary: trip }),
    
    addDay: (day) => set((state) => {
      if (state.activeItinerary) {
        state.activeItinerary.days.push(day);
        state.activeItinerary.updatedAt = new Date().toISOString();
      }
    }),
    
    removeDay: (dayId) => set((state) => {
      if (state.activeItinerary) {
        state.activeItinerary.days = state.activeItinerary.days.filter(d => d.id !== dayId);
        // Renumber days
        state.activeItinerary.days.forEach((day, index) => {
          day.dayNumber = index + 1;
        });
        state.activeItinerary.updatedAt = new Date().toISOString();
      }
    }),
    
    updateDay: (dayId, updates) => set((state) => {
      if (state.activeItinerary) {
        const day = state.activeItinerary.days.find(d => d.id === dayId);
        if (day) {
          Object.assign(day, updates);
          state.activeItinerary.updatedAt = new Date().toISOString();
        }
      }
    }),
    
    addActivity: (dayId, activity) => set((state) => {
      if (state.activeItinerary) {
        const day = state.activeItinerary.days.find(d => d.id === dayId);
        if (day) {
          day.activities.push(activity);
          state.activeItinerary.updatedAt = new Date().toISOString();
        }
      }
    }),
    
    removeActivity: (dayId, activityId) => set((state) => {
      if (state.activeItinerary) {
        const day = state.activeItinerary.days.find(d => d.id === dayId);
        if (day) {
          day.activities = day.activities.filter(a => a.id !== activityId);
          state.activeItinerary.updatedAt = new Date().toISOString();
        }
      }
    }),
    
    updateActivity: (dayId, activityId, updates) => set((state) => {
      if (state.activeItinerary) {
        const day = state.activeItinerary.days.find(d => d.id === dayId);
        if (day) {
          const activity = day.activities.find(a => a.id === activityId);
          if (activity) {
            Object.assign(activity, updates);
            state.activeItinerary.updatedAt = new Date().toISOString();
          }
        }
      }
    }),
    
    moveActivity: (fromDayId, toDayId, activityId) => set((state) => {
      if (state.activeItinerary) {
        const fromDay = state.activeItinerary.days.find(d => d.id === fromDayId);
        const toDay = state.activeItinerary.days.find(d => d.id === toDayId);
        if (fromDay && toDay) {
          const activityIndex = fromDay.activities.findIndex(a => a.id === activityId);
          if (activityIndex !== -1) {
            const [activity] = fromDay.activities.splice(activityIndex, 1);
            toDay.activities.push(activity);
            state.activeItinerary.updatedAt = new Date().toISOString();
          }
        }
      }
    }),
    
    addMessage: (message) => set((state) => {
      state.messages.push(message);
    }),
    
    setIsTyping: (isTyping) => set({ isTyping }),
    
    markProposalAsAdded: (messageId, proposalId) => set((state) => {
      const message = state.messages.find(m => m.id === messageId);
      if (message?.proposals) {
        const proposal = message.proposals.find(p => p.id === proposalId);
        if (proposal) {
          proposal.isAdded = true;
        }
      }
    }),
    
    setMapViewState: (viewState) => set((state) => {
      Object.assign(state.mapViewState, viewState);
    }),
    
    flyToCoordinates: (coordinates, zoom = 14) => set((state) => {
      state.mapViewState.center = coordinates;
      state.mapViewState.zoom = zoom;
    }),
    
    setSelectedActivity: (activityId) => set({ selectedActivityId: activityId }),
    
    setHoveredActivity: (activityId) => set({ hoveredActivityId: activityId }),
    
    setMobileView: (view) => set({ mobileView: view }),
    
    getAllActivities: () => {
      const state = get();
      if (!state.activeItinerary) return [];
      return state.activeItinerary.days.flatMap(day => day.activities);
    },
    
    getActivityById: (id) => {
      const state = get();
      if (!state.activeItinerary) return undefined;
      for (const day of state.activeItinerary.days) {
        const activity = day.activities.find(a => a.id === id);
        if (activity) return activity;
      }
      return undefined;
    }
  }))
);
