

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from './ui/sheet';
import { Send, Bot, User, Loader2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { curevanAssistant } from '@/ai/flows/chat-assistant';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { logAIFeedbackAction } from '@/lib/actions';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'positive' | 'negative' | 'none';
}

const getContextualWelcomeMessage = (pathname: string, name: string): string => {
    if (pathname.startsWith('/ecommerce') || pathname.startsWith('/shop')) return "Need help choosing the right product?";
    if (pathname.startsWith('/booking')) return "May I help you with your booking?";
    if (pathname.startsWith('/shop/checkout')) return "Need any help to complete your purchase?";
    if (pathname.startsWith('/dashboard/bookings')) return "Want an update on your booking?";
    if (pathname.startsWith('/therapists/')) return "Would you like to book this therapist?";
    
    return `Welcome, ${name}! How can I help you today?
e.g., "What are my upcoming appointments?"`;
}

export function AIChatAssistant() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const welcomeMessage = useMemo(() => {
      return getContextualWelcomeMessage(pathname, user?.name || 'there');
  }, [pathname, user?.name]);
  
  useEffect(() => {
    // Reset chat and show proactive message when sheet is opened, if it's the first time
    if (isOpen && messages.length === 0) {
      setMessages([{ id: nanoid(), role: 'assistant', content: welcomeMessage, feedback: 'none' }]);
    }
  }, [isOpen, welcomeMessage, messages.length]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: nanoid(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await curevanAssistant({ query: input });
      if (result.answer) {
        const assistantMessage: Message = { id: nanoid(), role: 'assistant', content: result.answer, feedback: 'none' };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('AI did not return an answer.');
      }
    } catch (error) {
      console.error('Error with AI Assistant:', error);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'Sorry, I was unable to process your request. Please try again.',
      });
      // Do not remove user's message on error, allow them to retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    await logAIFeedbackAction({
        context: 'chat_assistant',
        interactionId: messageId,
        rating,
        query: messages.find(m => m.id === messageId)?.content, // simplistic association
        response: message.content
    });

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: rating } : m));
    toast({ title: "Feedback Received", description: "Thank you for helping us improve!" });
  };


  if (!user) {
    return null; // Don't show the chat bubble if the user is not logged in
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-16 h-16 rounded-full shadow-lg z-40 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white hover:opacity-90 transition-opacity animate-pulse-strong"
          size="icon"
        >
          <Sparkles className="w-8 h-8" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot />
            Curevan Assistant
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 my-4">
          <div className="px-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col gap-2',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                 <div className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}>
                    {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><Bot/></AvatarFallback>
                    </Avatar>
                    )}
                    <div
                    className={cn(
                        'max-w-xs rounded-lg px-4 py-2 text-sm',
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    <pre className="whitespace-pre-wrap font-body">{message.content}</pre>
                    </div>
                    {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="@user" />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    )}
                </div>
                 {message.role === 'assistant' && message.feedback === 'none' && (
                    <div className="flex items-center gap-2 ml-11">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback(message.id, 'positive')}>
                            <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback(message.id, 'negative')}>
                            <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><Bot/></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
