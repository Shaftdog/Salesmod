import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Format email body with proper HTML
 * Converts plain text or poorly formatted text into proper HTML
 */
function formatEmailBody(body: string): string {
  if (!body) return body;
  
  // If already has substantial HTML tags, return as-is
  if (body.includes('<p>') && body.includes('</p>')) {
    return body;
  }
  
  // Step 1: Detect and format bullet/numbered lists with various patterns
  // Pattern 1: "1. Item" or "• Item" style
  const hasNumberedList = /\d+\.\s+[A-Z]/.test(body);
  const hasBulletList = /[•\-\*]\s+[A-Z]/.test(body);
  
  // Pattern 2: "First bullet point", "Second bullet point" style
  const hasWordedList = /(First|Second|Third|Fourth|Fifth)[\s\w]*:/gi.test(body);
  
  let formatted = body;
  
  // Convert "First bullet point:", "Second bullet point:" to proper list
  if (hasWordedList) {
    // Split on sentence patterns that indicate list items
    const listPattern = /((?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:[\s\S]*?)(?=(?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:|$)/gi;
    const listItems = body.match(listPattern);
    
    if (listItems && listItems.length > 1) {
      // Find intro text before the list
      const introMatch = body.match(/^([\s\S]*?)(?=First|Second|Third|Fourth|Fifth)/i);
      let result = '';
      
      if (introMatch && introMatch[1].trim()) {
        result += `<p>${introMatch[1].trim()}</p>`;
      }
      
      result += '<ol>';
      listItems.forEach(item => {
        const cleanItem = item.replace(/^(First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:\s*/i, '').trim();
        if (cleanItem) {
          result += `<li>${cleanItem}</li>`;
        }
      });
      result += '</ol>';
      
      // Find closing text after the list
      const lastItem = listItems[listItems.length - 1];
      const closingMatch = body.split(lastItem)[1];
      if (closingMatch && closingMatch.trim()) {
        result += `<p>${closingMatch.trim()}</p>`;
      }
      
      return result;
    }
  }
  
  // Convert numbered lists (1. 2. 3. etc.)
  if (hasNumberedList) {
    const lines = body.split(/\.\s+(?=\d+\.|\w)/);
    let result = '';
    let inList = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        if (!inList) {
          result += '<ol>';
          inList = true;
        }
        const item = trimmed.replace(/^\d+\.\s*/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ol>';
          inList = false;
        }
        result += `<p>${trimmed}</p>`;
      }
    });
    
    if (inList) result += '</ol>';
    return result;
  }
  
  // Convert bullet lists (• or - or *)
  if (hasBulletList) {
    const lines = body.split(/\n/);
    let result = '';
    let inList = false;
    let currentParagraph = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (currentParagraph) {
          result += `<p>${currentParagraph.trim()}</p>`;
          currentParagraph = '';
        }
        if (!inList) {
          result += '<ul>';
          inList = true;
        }
        const item = trimmed.replace(/^[•\-\*]\s+/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      }
    });
    
    if (currentParagraph) {
      result += `<p>${currentParagraph.trim()}</p>`;
    }
    if (inList) result += '</ul>';
    return result;
  }
  
  // No lists detected - format as paragraphs
  // Split by double line breaks first
  const paragraphs = body.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`)
      .join('');
  }
  
  // Split by single line breaks and group as sentences
  const sentences = body.split(/\.\s+/);
  if (sentences.length > 3) {
    // Group every 2-3 sentences into a paragraph
    let result = '<p>';
    sentences.forEach((sentence, idx) => {
      result += sentence.trim();
      if (!sentence.trim().endsWith('.')) result += '.';
      
      // Start new paragraph every 2-3 sentences
      if ((idx + 1) % 2 === 0 && idx < sentences.length - 1) {
        result += '</p><p>';
      } else if (idx < sentences.length - 1) {
        result += ' ';
      }
    });
    result += '</p>';
    return result;
  }
  
  // Single paragraph - just wrap it
  return `<p>${body}</p>`;
}

/**
 * POST /api/agent/chat/create-card
 * Create a card from chat conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, clientId, title, rationale, priority, emailDraft, taskDetails } = body;

    if (!type || !clientId || !title || !rationale) {
      return NextResponse.json(
        { error: 'Missing required fields: type, clientId, title, rationale' },
        { status: 400 }
      );
    }

    // Validate email cards have required fields
    if (type === 'send_email') {
      if (!emailDraft) {
        return NextResponse.json(
          { error: 'send_email type requires emailDraft with to, subject, and body fields' },
          { status: 400 }
        );
      }
      if (!emailDraft.to || !emailDraft.to.includes('@')) {
        return NextResponse.json(
          { error: 'Email draft must include a valid to address' },
          { status: 400 }
        );
      }
      if (!emailDraft.subject || emailDraft.subject.length < 5) {
        return NextResponse.json(
          { error: 'Email subject must be at least 5 characters' },
          { status: 400 }
        );
      }
      if (!emailDraft.body || emailDraft.body.length < 20) {
        return NextResponse.json(
          { error: 'Email body must be at least 20 characters' },
          { status: 400 }
        );
      }
    }

    // Build action payload
    let actionPayload: any = {};
    if (emailDraft) {
      actionPayload = {
        ...emailDraft,
        body: formatEmailBody(emailDraft.body),
      };
    } else if (taskDetails) {
      actionPayload = taskDetails;
    }

    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        org_id: user.id,
        client_id: clientId,
        type,
        title,
        rationale,
        priority: priority || 'medium',
        state: 'suggested',
        action_payload: actionPayload,
        created_by: user.id, // User created via chat
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      card: {
        id: data.id,
        title: data.title,
        type: data.type,
        state: data.state,
      },
    });
  } catch (error: any) {
    console.error('Card creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create card' },
      { status: 500 }
    );
  }
}

