import { useCallback } from 'react';
import { useTravelStore } from '@/store/travelStore';
import type { Activity, ChatMessage, ActivityProposal } from '@/types/trip';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

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
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);
    setIsTyping(true);

    try {
      // Build conversation history (last 20 messages for context)
      const recentMessages = [...useTravelStore.getState().messages]
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      // Build itinerary context
      const itineraryContext = activeItinerary
        ? {
            destination: activeItinerary.destination,
            name: activeItinerary.name,
            dates: `${activeItinerary.startDate} to ${activeItinerary.endDate}`,
            days: activeItinerary.days.map(d => ({
              dayNumber: d.dayNumber,
              date: d.date,
              title: d.title,
              activities: d.activities.map(a => a.name)
            }))
          }
        : null;

      const { data, error } = await supabase.functions.invoke('travel-chat', {
        body: { messages: recentMessages, itineraryContext }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Build proposals from AI-suggested activities
      const proposals: ActivityProposal[] = (data.activities || []).map((a: any) => ({
        id: uuidv4(),
        activity: {
          id: uuidv4(),
          name: a.name,
          description: a.description,
          coordinates: { lat: a.lat, lng: a.lng },
          category: a.category,
          timeSlot: a.timeSlot,
          duration: a.duration,
          price: a.price,
          rating: a.rating,
          address: a.address,
        } as Activity,
        suggestedDay: 1,
        isAdded: false
      }));

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        proposals: proposals.length > 0 ? proposals : undefined
      };

      addMessage(aiMessage);
    } catch (err: any) {
      console.error('Travel chat error:', err);
      
      const errorContent = err?.message?.includes('Rate limit')
        ? "I'm getting too many requests right now. Please wait a moment and try again."
        : err?.message?.includes('usage limit')
        ? "AI usage limit reached. Please add credits to continue using AI recommendations."
        : "Sorry, I had trouble processing that. Please try again!";

      toast({
        title: "AI Error",
        description: errorContent,
        variant: "destructive"
      });

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString()
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [addMessage, setIsTyping, activeItinerary]);

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
