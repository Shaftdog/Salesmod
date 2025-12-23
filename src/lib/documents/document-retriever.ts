/**
 * P1.1: Documents Library - Retrieval Service
 * Semantic search and document retrieval for RAG
 */

import { createClient } from '@/lib/supabase/server';
import { searchRAG, RAGResult } from '@/lib/agent/rag';
import {
  Document,
  DocumentSearchResult,
  DocumentSearchOptions,
  mapRowToDocument,
} from './types';

/**
 * Semantic search across documents
 */
export async function searchDocuments(
  orgId: string,
  options: DocumentSearchOptions
): Promise<DocumentSearchResult[]> {
  const { query, limit = 10, threshold = 0.6 } = options;

  // Use existing RAG search
  const ragResults = await searchRAG(orgId, query, limit * 2, threshold);

  // Filter to document sources only
  const documentResults = ragResults.filter((r) => r.source === 'document');

  if (documentResults.length === 0) {
    return [];
  }

  // Get unique document IDs
  const documentIds = [
    ...new Set(documentResults.map((r) => r.sourceId).filter(Boolean)),
  ] as string[];

  // Fetch full document records
  const supabase = await createClient();
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .in('id', documentIds);

  if (error || !docs) {
    console.error('[Retriever] Failed to fetch documents:', error);
    return [];
  }

  // Apply additional filters if provided
  let filteredDocs = docs;
  if (options.category) {
    filteredDocs = filteredDocs.filter((d) => d.category === options.category);
  }
  if (options.sourceType) {
    filteredDocs = filteredDocs.filter((d) => d.source_type === options.sourceType);
  }
  if (options.tags && options.tags.length > 0) {
    filteredDocs = filteredDocs.filter((d) =>
      options.tags!.some((tag) => d.tags?.includes(tag))
    );
  }

  // Map RAG results to DocumentSearchResult
  const results: DocumentSearchResult[] = [];
  for (const ragResult of documentResults) {
    const doc = filteredDocs.find((d) => d.id === ragResult.sourceId);
    if (!doc) continue;

    results.push({
      ...mapRowToDocument(doc),
      similarity: ragResult.similarity,
      matchedContent: extractMatchedContent(ragResult.content, query),
    });
  }

  // Sort by similarity and limit
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

/**
 * Extract the most relevant portion of content for display
 */
function extractMatchedContent(
  content: string,
  query: string,
  maxLength: number = 500
): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Try to find query terms in content
  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();

  let bestStartIndex = 0;
  let bestMatchCount = 0;

  // Scan through content to find the section with most query term matches
  const windowSize = maxLength;
  for (let i = 0; i < content.length - windowSize; i += 50) {
    const window = contentLower.slice(i, i + windowSize);
    let matchCount = 0;
    for (const term of queryTerms) {
      if (window.includes(term)) {
        matchCount++;
      }
    }
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestStartIndex = i;
    }
  }

  // Extract the window
  let excerpt = content.slice(bestStartIndex, bestStartIndex + maxLength);

  // Clean up - try to start/end at word boundaries
  if (bestStartIndex > 0) {
    const firstSpace = excerpt.indexOf(' ');
    if (firstSpace > 0 && firstSpace < 50) {
      excerpt = '...' + excerpt.slice(firstSpace + 1);
    }
  }

  const lastSpace = excerpt.lastIndexOf(' ');
  if (lastSpace > excerpt.length - 50) {
    excerpt = excerpt.slice(0, lastSpace) + '...';
  } else if (bestStartIndex + maxLength < content.length) {
    excerpt += '...';
  }

  return excerpt;
}

/**
 * Get related documents based on content similarity
 */
export async function getRelatedDocuments(
  documentId: string,
  limit: number = 5
): Promise<DocumentSearchResult[]> {
  const supabase = await createClient();

  // Get document's extracted text
  const { data: doc, error } = await supabase
    .from('documents')
    .select('tenant_id, extracted_text, title')
    .eq('id', documentId)
    .single();

  if (error || !doc?.extracted_text) {
    console.log('[Retriever] Document not found or no extracted text');
    return [];
  }

  // Get tenant's org_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('owner_id')
    .eq('id', doc.tenant_id)
    .single();

  let orgId = tenant?.owner_id;
  if (!orgId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', doc.tenant_id)
      .limit(1)
      .single();
    orgId = profile?.id;
  }

  if (!orgId) {
    console.error('[Retriever] Could not determine org_id');
    return [];
  }

  // Use document content for search (truncated for embedding)
  const searchText = `${doc.title || ''} ${doc.extracted_text}`.substring(0, 1000);

  // Search for similar documents
  const results = await searchDocuments(orgId, {
    query: searchText,
    limit: limit + 1, // Extra one to filter out self
  });

  // Filter out the source document
  return results.filter((r) => r.id !== documentId).slice(0, limit);
}

/**
 * Get document context for AI chat
 * Returns formatted context string for LLM prompts
 */
export async function getDocumentContext(
  orgId: string,
  query: string,
  maxTokens: number = 2000
): Promise<string> {
  const results = await searchDocuments(orgId, {
    query,
    limit: 5,
    threshold: 0.5, // Lower threshold for broader results
  });

  if (results.length === 0) {
    return '';
  }

  // Estimate tokens (rough: 4 chars per token)
  let totalChars = 0;
  const maxChars = maxTokens * 4;

  const contextParts: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const doc = results[i];
    const content = doc.matchedContent || doc.extractedText?.substring(0, 500) || '';

    if (totalChars + content.length > maxChars) break;
    totalChars += content.length;

    contextParts.push(
      `### Document ${i + 1}: ${doc.title || doc.fileName} (${Math.round(doc.similarity * 100)}% match)
Category: ${doc.category}
Source: ${doc.sourceType}
Content: ${content}`
    );
  }

  if (contextParts.length === 0) {
    return '';
  }

  return `
## Relevant Documents from Library

${contextParts.join('\n\n')}
`.trim();
}

/**
 * Full-text search across documents (non-semantic)
 * Searches in title, description, and extracted_text
 */
export async function textSearchDocuments(
  tenantId: string,
  searchQuery: string,
  options: {
    category?: string;
    limit?: number;
  } = {}
): Promise<Document[]> {
  const supabase = await createClient();
  const { limit = 20 } = options;

  // Build search pattern
  const pattern = `%${searchQuery.toLowerCase()}%`;

  let query = supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(
      `title.ilike.${pattern},description.ilike.${pattern},extracted_text.ilike.${pattern},file_name.ilike.${pattern}`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.category) {
    query = query.eq('category', options.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Retriever] Text search failed:', error);
    return [];
  }

  return (data || []).map(mapRowToDocument);
}

/**
 * Get documents by tags
 */
export async function getDocumentsByTags(
  tenantId: string,
  tags: string[],
  options: {
    matchAll?: boolean; // If true, document must have ALL tags
    limit?: number;
  } = {}
): Promise<Document[]> {
  const supabase = await createClient();
  const { matchAll = false, limit = 20 } = options;

  let query = supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (matchAll) {
    // Document must have all specified tags
    query = query.contains('tags', tags);
  } else {
    // Document must have at least one of the specified tags
    query = query.overlaps('tags', tags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Retriever] Get by tags failed:', error);
    return [];
  }

  return (data || []).map(mapRowToDocument);
}

/**
 * Get recent documents for a tenant
 */
export async function getRecentDocuments(
  tenantId: string,
  limit: number = 10
): Promise<Document[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Retriever] Get recent failed:', error);
    return [];
  }

  return (data || []).map(mapRowToDocument);
}

/**
 * Get all unique tags used in tenant's documents
 */
export async function getAllDocumentTags(tenantId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('tags')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Retriever] Get tags failed:', error);
    return [];
  }

  // Flatten and dedupe tags
  const allTags = new Set<string>();
  for (const doc of data || []) {
    for (const tag of doc.tags || []) {
      allTags.add(tag);
    }
  }

  return Array.from(allTags).sort();
}
