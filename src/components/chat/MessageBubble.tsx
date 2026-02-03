import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { ProposalCard } from './ProposalCard';
import type { ChatMessage, Day, ActivityProposal } from '@/types/trip';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  days: Day[];
  onAddProposal: (messageId: string, proposal: ActivityProposal, dayId: string) => void;
}

export function MessageBubble({ message, days, onAddProposal }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className={cn(
        "flex flex-col gap-2 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted rounded-bl-md"
        )}>
          {message.content}
        </div>

        {message.proposals && message.proposals.length > 0 && (
          <motion.div 
            className="grid gap-3 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message.proposals.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                messageId={message.id}
                days={days}
                onAddToItinerary={onAddProposal}
              />
            ))}
          </motion.div>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </motion.div>
  );
}
