/**
 * Parse natural language commands for card management
 */

export interface CommandIntent {
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'execute' | 'none';
  cardType?: string;
  clientName?: string;
  priority?: string;
  cardId?: string;
  topic?: string;
  details?: string;
}

/**
 * Detect if message is a command and extract intent
 */
export function parseCommand(message: string): CommandIntent {
  const lower = message.toLowerCase();

  // Create commands
  if (lower.includes('create') || lower.includes('draft') || lower.includes('make')) {
    return {
      action: 'create',
      cardType: detectCardType(lower),
      clientName: extractClientName(message),
      priority: extractPriority(lower),
      topic: extractTopic(message),
    };
  }

  // Delete commands
  if (lower.includes('delete') || lower.includes('remove')) {
    return {
      action: 'delete',
      cardId: extractCardId(message),
    };
  }

  // Update/Edit commands
  if (lower.includes('edit') || lower.includes('update') || lower.includes('change')) {
    return {
      action: 'update',
      cardId: extractCardId(message),
      details: message,
      priority: extractPriority(lower),
    };
  }

  // Approve commands
  if (lower.includes('approve')) {
    return {
      action: 'approve',
      cardId: extractCardId(message),
    };
  }

  // Reject commands
  if (lower.includes('reject') || lower.includes('dismiss')) {
    return {
      action: 'reject',
      cardId: extractCardId(message),
    };
  }

  // Execute commands
  if (lower.includes('execute') || lower.includes('run')) {
    return {
      action: 'execute',
      cardId: extractCardId(message),
    };
  }

  return { action: 'none' };
}

function detectCardType(message: string): string {
  if (message.includes('email')) return 'send_email';
  if (message.includes('task')) return 'create_task';
  if (message.includes('call')) return 'schedule_call';
  if (message.includes('deal')) return 'create_deal';
  if (message.includes('research')) return 'research';
  return 'create_task'; // Default
}

function extractClientName(message: string): string | undefined {
  // Look for "for [Client]" or "to [Client]"
  const forMatch = message.match(/(?:for|to|about)\s+([A-Z][a-zA-Z\s]+?)(?:\s+about|\s+regarding|$)/);
  if (forMatch) {
    return forMatch[1].trim();
  }

  // Look for known client names (Acme, iFund, etc.)
  if (message.toLowerCase().includes('acme')) return 'Acme Real Estate';
  if (message.toLowerCase().includes('ifund')) return 'ifund Cities';

  return undefined;
}

function extractPriority(message: string): string | undefined {
  if (message.includes('high priority') || message.includes('urgent')) return 'high';
  if (message.includes('low priority')) return 'low';
  if (message.includes('medium priority')) return 'medium';
  return undefined;
}

function extractCardId(message: string): string | undefined {
  // Look for "card #123" or "card 123"  
  const match = message.match(/card\s*#?(\d+)/i);
  if (match) return match[1];
  
  // Look for UUID patterns
  const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];
  
  return undefined;
}

function extractTopic(message: string): string | undefined {
  // Look for "about [topic]"
  const match = message.match(/about\s+(.+?)(?:\.|$)/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Check if message is likely a command
 */
export function isCommand(message: string): boolean {
  const lower = message.toLowerCase();
  const commandWords = ['create', 'draft', 'make', 'delete', 'remove', 'edit', 'update', 
                        'change', 'approve', 'reject', 'execute', 'run'];
  return commandWords.some(word => lower.includes(word));
}

