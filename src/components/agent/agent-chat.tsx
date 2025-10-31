'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatMessages, useSaveChatMessage, useClearChatHistory } from '@/hooks/use-chat-messages';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

export function AgentChat() {
  const { data: chatHistory, isLoading: historyLoading } = useChatMessages(500);
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
      // Filter out system messages and ensure only user/assistant roles
      setMessages(chatHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
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
      console.log('[Chat] Sending request to /api/agent/chat with tool support');
      
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[Chat] Request timeout after 60 seconds');
        controller.abort();
      }, 60000); // 60 second timeout

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      console.log('[Chat] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Chat] Error response:', errorText);
        throw new Error(`Chat request failed: ${response.status} ${errorText.substring(0, 100)}`);
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
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[Chat] Stream finished, total chunks:', chunkCount);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
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
        
        console.log('[Chat] Final content length:', assistantContent.length);
        
        // Save final assistant message to database
        if (assistantContent) {
          saveChatMessage.mutate({ role: 'assistant', content: assistantContent });
        } else {
          console.warn('[Chat] No content received from stream');
        }
      } else {
        console.error('[Chat] No reader available');
      }
    } catch (err: any) {
      console.error('[Chat] Error:', err);
      
      let errorMessage = 'Sorry, I encountered an error.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The AI service is taking too long to respond. Please try again with a simpler question.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Sorry, I encountered an error: ${err.message}`;
      }
      
      setError(errorMessage);
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
    { label: 'Draft Email', prompt: 'Help me draft an email to one of my clients' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleClearHistory = () => {
    clearHistory.mutate();
    setMessages([]);
  };

  // Function to render tool invocations
  const renderToolInvocations = (toolInvocations: any[]) => {
    if (!toolInvocations || toolInvocations.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2 border-t pt-2 opacity-75">
        {toolInvocations.map((tool: any, i: number) => {
          const toolName = tool.toolName || 'unknown';
          const state = tool.state;
          
          return (
            <div key={i} className="text-xs flex items-start gap-2">
              {state === 'result' ? (
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
              ) : (
                <Loader2 className="h-3 w-3 mt-0.5 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{toolName}</div>
                {tool.result && (
                  <div className="mt-1 text-xs opacity-75 truncate">
                    {typeof tool.result === 'string' 
                      ? tool.result 
                      : JSON.stringify(tool.result).substring(0, 100)
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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
                    {message.role === 'user' ? (
                      // User messages: simple text
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      // Assistant messages: rendered markdown
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        "prose-p:my-2 prose-p:leading-relaxed",
                        "prose-pre:my-2 prose-pre:bg-gray-900 prose-pre:text-gray-100",
                        "prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                        "prose-ul:my-2 prose-ol:my-2",
                        "prose-li:my-1",
                        "prose-headings:mt-4 prose-headings:mb-2",
                        "prose-strong:text-gray-900 prose-strong:font-semibold",
                        "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                      )}>
                        {message.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : isLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-sm italic">Thinking...</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    {/* Show tool calls if any */}
                    {message.toolInvocations && renderToolInvocations(message.toolInvocations)}
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

