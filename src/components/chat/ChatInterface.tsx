import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from './MessageBubble';
import { useTravelPlanner } from '@/hooks/useTravelPlanner';

const quickPrompts = [
  "Suggest restaurants",
  "Find hostels",
  "Add a day",
  "Coworking spots",
  "Best time to visit"
];

export function ChatInterface() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    activeItinerary,
    messages,
    isTyping,
    sendMessage,
    addProposalToItinerary
  } = useTravelPlanner();

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Nomaaad AI</h2>
          <p className="text-xs text-muted-foreground">Your travel companion</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                days={activeItinerary?.days || []}
                onAddProposal={addProposalToItinerary}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex gap-1.5 items-center px-4 py-3 bg-muted rounded-2xl rounded-bl-lg">
                  <Skeleton className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <Skeleton className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <Skeleton className="w-2 h-2 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2.5 border-t border-border/30 bg-muted/20">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickPrompts.map(prompt => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs h-8 rounded-2xl border-border/50 bg-card/50 hover:bg-card"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your trip..."
            className="flex-1 rounded-2xl h-11 bg-background/80"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="rounded-2xl h-11 w-11 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
