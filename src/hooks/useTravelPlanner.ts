import { useCallback } from 'react';
import { useTravelStore } from '@/store/travelStore';
import type { Activity, Day, ChatMessage, ActivityProposal } from '@/types/trip';
import { v4 as uuidv4 } from 'uuid';

// Simulated AI responses for demo
const aiResponses: Record<string, { content: string; proposals?: Partial<Activity>[] }> = {
  default: {
    content: "I'd be happy to help you plan your trip! What would you like to know or modify in your itinerary?"
  },
  restaurant: {
    content: "I found some amazing restaurants for you! Here are my top recommendations:",
    proposals: [
      {
        name: "Ristorante Il Ritrovo",
        description: "Authentic Italian cuisine with a panoramic terrace",
        coordinates: { lat: 40.6298, lng: 14.4861 },
        category: 'restaurant' as const,
        timeSlot: 'evening' as const,
        rating: 4.7,
        price: 80
      },
      {
        name: "Da Adolfo",
        description: "Beachside seafood restaurant accessible only by boat",
        coordinates: { lat: 40.6142, lng: 14.5011 },
        category: 'restaurant' as const,
        timeSlot: 'afternoon' as const,
        rating: 4.8,
        price: 60
      }
    ]
  },
  activity: {
    content: "Here are some exciting activities you might enjoy:",
    proposals: [
      {
        name: "Path of the Gods Hike",
        description: "Breathtaking hiking trail with stunning coastal views",
        coordinates: { lat: 40.6389, lng: 14.5025 },
        category: 'activity' as const,
        timeSlot: 'morning' as const,
        duration: 240,
        rating: 4.9
      },
      {
        name: "Kayak Tour",
        description: "Explore hidden coves and beaches by kayak",
        coordinates: { lat: 40.6265, lng: 14.4893 },
        category: 'activity' as const,
        timeSlot: 'morning' as const,
        duration: 180,
        price: 55,
        rating: 4.6
      }
    ]
  }
};

export function useTravelPlanner() {
  const {
    activeItinerary,
    messages,
    isTyping,
    addDay,
    removeDay,
    updateDay,
    addActivity,
    removeActivity,
    updateActivity,
    moveActivity,
    addMessage,
    setIsTyping,
    markProposalAsAdded,
    flyToCoordinates
  } = useTravelStore();

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Determine response based on content
    let responseKey = 'default';
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('restaurant') || lowerContent.includes('food') || lowerContent.includes('eat') || lowerContent.includes('dinner')) {
      responseKey = 'restaurant';
    } else if (lowerContent.includes('activity') || lowerContent.includes('hike') || lowerContent.includes('kayak') || lowerContent.includes('do')) {
      responseKey = 'activity';
    }

    const response = aiResponses[responseKey];
    const proposals: ActivityProposal[] = response.proposals?.map(p => ({
      id: uuidv4(),
      activity: {
        id: uuidv4(),
        ...p,
        name: p.name || '',
        description: p.description || '',
        coordinates: p.coordinates || { lat: 0, lng: 0 },
        category: p.category || 'activity',
        timeSlot: p.timeSlot || 'morning'
      },
      suggestedDay: 1,
      isAdded: false
    })) || [];

    const aiMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      proposals: proposals.length > 0 ? proposals : undefined
    };

    addMessage(aiMessage);
    setIsTyping(false);
  }, [addMessage, setIsTyping]);

  const addProposalToItinerary = useCallback((messageId: string, proposal: ActivityProposal, dayId: string) => {
    addActivity(dayId, proposal.activity);
    markProposalAsAdded(messageId, proposal.id);
    flyToCoordinates(proposal.activity.coordinates);
  }, [addActivity, markProposalAsAdded, flyToCoordinates]);

  const deleteDayFromItinerary = useCallback((dayId: string) => {
    removeDay(dayId);
  }, [removeDay]);

  const deleteActivityFromItinerary = useCallback((dayId: string, activityId: string) => {
    removeActivity(dayId, activityId);
  }, [removeActivity]);

  return {
    activeItinerary,
    messages,
    isTyping,
    sendMessage,
    addProposalToItinerary,
    deleteDayFromItinerary,
    deleteActivityFromItinerary,
    addDay,
    removeDay,
    updateDay,
    addActivity,
    removeActivity,
    updateActivity,
    moveActivity
  };
}
