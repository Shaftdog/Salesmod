'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Sparkles, User, Bot, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatMessages, useSaveChatMessage, useClearChatHistory } from '@/hooks/use-chat-messages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

export function AgentChat() {
  const { data: chatHistory, isLoading: historyLoading } = useChatMessages(50);
  const saveChatMessage = useSaveChatMessage();
  const clearHistory = useClearChatHistory();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Load chat history on mount
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      })));
    }
  }, [chatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    // Add to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Save user message to database
    saveChatMessage.mutate({ role: 'user', content: userMessage.content });

    try {
      const response = await fetch('/api/agent/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = Date.now().toString();
      
      // Add initial empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          
          // Update assistant message in real-time
          setMessages((prev) => {
            return prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: assistantContent }
                : m
            );
          });
        }
        
        // Save final assistant message to database
        if (assistantContent) {
          saveChatMessage.mutate({ role: 'assistant', content: assistantContent });
        }
      }
    } catch (err: any) {
      setError(err.message);
      const errorMessage = `Sorry, I encountered an error: ${err.message}`;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMessage,
        },
      ]);
      // Save error message too
      saveChatMessage.mutate({ role: 'assistant', content: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Check Goals', prompt: 'What are my current goals and how am I tracking?' },
    { label: 'Pending Actions', prompt: 'What actions are pending my review?' },
    { label: 'Recent Activity', prompt: 'Summarize recent activity with my clients' },
    { label: 'Draft Email', prompt: 'Help me draft an email to Acme' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleClearHistory = () => {
    clearHistory.mutate();
    setMessages([]);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span>Chat with Agent</span>
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearHistory}
              className="ml-auto h-6 w-6 p-0"
              title="Clear chat history"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages - Fixed height scrollable container */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ height: 'calc(100vh - 400px)', maxHeight: '500px', minHeight: '300px' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ask me anything about your clients, goals, or business!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                    
                    {/* Show tool calls if any */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-500/20">
                        {message.toolInvocations.map((tool: any, i: number) => (
                          <div key={i} className="text-xs opacity-75 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Using tool: {tool.toolName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the agent anything..."
              disabled={isLoading}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

