#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from multiple locations
const envPaths = [
  path.join(process.cwd(), ".env"),
  path.join(process.env.HOME || "", ".claude", "mcp-servers", "memory-server", ".env"),
  path.join(__dirname, "..", ".env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Initialize clients
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Helper to get project name from current directory
function getProjectName(): string {
  const cwd = process.cwd();
  return path.basename(cwd);
}

// Generate embedding for text
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

// Define tools
const tools: Tool[] = [
  {
    name: "store_memory",
    description:
      "Store a new memory with semantic embedding. Use this to save important decisions, patterns, lessons learned, or context for future reference.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The memory content to store",
        },
        title: {
          type: "string",
          description: "Short title/summary of the memory",
        },
        category: {
          type: "string",
          enum: ["decision", "pattern", "preference", "lesson", "context", "general"],
          description: "Category of memory",
          default: "general",
        },
        project: {
          type: "string",
          description: "Project name (defaults to current directory name, use 'global' for cross-project)",
        },
        importance: {
          type: "number",
          description: "Importance score 0-1 (higher = more likely to surface in searches)",
          default: 0.5,
        },
        metadata: {
          type: "object",
          description: "Additional metadata to store with the memory",
        },
        expires_in_days: {
          type: "number",
          description: "Optional: Number of days until this memory expires",
        },
      },
      required: ["content", "title"],
    },
  },
  {
    name: "search_memories",
    description:
      "Search memories by semantic similarity. Returns the most relevant memories based on meaning, not just keywords.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - will find semantically similar memories",
        },
        project: {
          type: "string",
          description: "Filter by project name (defaults to current project)",
        },
        category: {
          type: "string",
          enum: ["decision", "pattern", "preference", "lesson", "context", "general"],
          description: "Filter by category",
        },
        include_global: {
          type: "boolean",
          description: "Include global memories in results",
          default: true,
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 10,
        },
        threshold: {
          type: "number",
          description: "Minimum similarity threshold 0-1",
          default: 0.7,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_memories",
    description: "List memories with optional filtering. Good for browsing what's stored.",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Filter by project name",
        },
        category: {
          type: "string",
          enum: ["decision", "pattern", "preference", "lesson", "context", "general"],
          description: "Filter by category",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 20,
        },
        sort_by: {
          type: "string",
          enum: ["created_at", "importance", "last_accessed_at", "access_count"],
          description: "Sort field",
          default: "created_at",
        },
      },
    },
  },
  {
    name: "get_memory",
    description: "Get a specific memory by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Memory UUID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_memory",
    description: "Update an existing memory's content or metadata",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Memory UUID to update",
        },
        content: {
          type: "string",
          description: "New content (will regenerate embedding)",
        },
        title: {
          type: "string",
          description: "New title",
        },
        category: {
          type: "string",
          enum: ["decision", "pattern", "preference", "lesson", "context", "general"],
        },
        importance: {
          type: "number",
          description: "New importance score 0-1",
        },
        metadata: {
          type: "object",
          description: "New metadata (merged with existing)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_memory",
    description: "Delete a memory by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Memory UUID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "memory_stats",
    description: "Get statistics about stored memories",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Filter stats by project",
        },
      },
    },
  },
];

// Tool implementations
async function storeMemory(args: {
  content: string;
  title: string;
  category?: string;
  project?: string;
  importance?: number;
  metadata?: Record<string, unknown>;
  expires_in_days?: number;
}) {
  const embedding = await generateEmbedding(`${args.title}\n\n${args.content}`);

  const expiresAt = args.expires_in_days
    ? new Date(Date.now() + args.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("claude_memories")
    .insert({
      project_name: args.project || getProjectName(),
      project_path: process.cwd(),
      category: args.category || "general",
      title: args.title,
      content: args.content,
      embedding: embedding,
      importance: args.importance || 0.5,
      metadata: args.metadata || {},
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to store memory: ${error.message}`);

  return {
    success: true,
    id: data.id,
    message: `Memory stored successfully with ID: ${data.id}`,
  };
}

async function searchMemories(args: {
  query: string;
  project?: string;
  category?: string;
  include_global?: boolean;
  limit?: number;
  threshold?: number;
}) {
  const embedding = await generateEmbedding(args.query);

  const { data, error } = await supabase.rpc("search_claude_memories", {
    query_embedding: embedding,
    match_threshold: args.threshold || 0.7,
    match_count: args.limit || 10,
    filter_project: args.project || getProjectName(),
    filter_category: args.category || null,
    include_global: args.include_global !== false,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);

  // Update access tracking for returned memories
  for (const memory of data || []) {
    await supabase.rpc("update_memory_access", { memory_id: memory.id });
  }

  return {
    count: data?.length || 0,
    memories: data?.map((m: Record<string, unknown>) => ({
      id: m.id,
      project: m.project_name,
      category: m.category,
      title: m.title,
      content: m.content,
      similarity: Math.round((m.similarity as number) * 100) + "%",
      importance: m.importance,
      created_at: m.created_at,
    })),
  };
}

async function listMemories(args: {
  project?: string;
  category?: string;
  limit?: number;
  sort_by?: string;
}) {
  let query = supabase
    .from("claude_memories")
    .select("id, project_name, category, title, content, importance, access_count, created_at, last_accessed_at")
    .is("expires_at", null)
    .or(`expires_at.gt.${new Date().toISOString()}`);

  if (args.project) {
    query = query.eq("project_name", args.project);
  }
  if (args.category) {
    query = query.eq("category", args.category);
  }

  const sortField = args.sort_by || "created_at";
  query = query.order(sortField, { ascending: false }).limit(args.limit || 20);

  const { data, error } = await query;

  if (error) throw new Error(`List failed: ${error.message}`);

  return {
    count: data?.length || 0,
    memories: data?.map((m) => ({
      id: m.id,
      project: m.project_name,
      category: m.category,
      title: m.title,
      content: m.content.substring(0, 200) + (m.content.length > 200 ? "..." : ""),
      importance: m.importance,
      access_count: m.access_count,
      created_at: m.created_at,
    })),
  };
}

async function getMemory(args: { id: string }) {
  const { data, error } = await supabase
    .from("claude_memories")
    .select("*")
    .eq("id", args.id)
    .single();

  if (error) throw new Error(`Memory not found: ${error.message}`);

  // Update access tracking
  await supabase.rpc("update_memory_access", { memory_id: args.id });

  return {
    id: data.id,
    project: data.project_name,
    category: data.category,
    title: data.title,
    content: data.content,
    importance: data.importance,
    metadata: data.metadata,
    access_count: data.access_count + 1,
    created_at: data.created_at,
    last_accessed_at: new Date().toISOString(),
  };
}

async function updateMemory(args: {
  id: string;
  content?: string;
  title?: string;
  category?: string;
  importance?: number;
  metadata?: Record<string, unknown>;
}) {
  const updates: Record<string, unknown> = {};

  if (args.title) updates.title = args.title;
  if (args.category) updates.category = args.category;
  if (args.importance !== undefined) updates.importance = args.importance;

  if (args.content) {
    updates.content = args.content;
    // Regenerate embedding with new content
    const title = args.title || (await getMemory({ id: args.id })).title;
    updates.embedding = await generateEmbedding(`${title}\n\n${args.content}`);
  }

  if (args.metadata) {
    // Merge with existing metadata
    const current = await getMemory({ id: args.id });
    updates.metadata = { ...current.metadata, ...args.metadata };
  }

  const { data, error } = await supabase
    .from("claude_memories")
    .update(updates)
    .eq("id", args.id)
    .select()
    .single();

  if (error) throw new Error(`Update failed: ${error.message}`);

  return {
    success: true,
    id: data.id,
    message: "Memory updated successfully",
  };
}

async function deleteMemory(args: { id: string }) {
  const { error } = await supabase.from("claude_memories").delete().eq("id", args.id);

  if (error) throw new Error(`Delete failed: ${error.message}`);

  return {
    success: true,
    message: `Memory ${args.id} deleted`,
  };
}

async function memoryStats(args: { project?: string }) {
  let query = supabase.from("claude_memories").select("project_name, category, importance");

  if (args.project) {
    query = query.eq("project_name", args.project);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Stats failed: ${error.message}`);

  const stats = {
    total: data?.length || 0,
    by_project: {} as Record<string, number>,
    by_category: {} as Record<string, number>,
    avg_importance: 0,
  };

  let totalImportance = 0;
  for (const memory of data || []) {
    stats.by_project[memory.project_name] = (stats.by_project[memory.project_name] || 0) + 1;
    stats.by_category[memory.category] = (stats.by_category[memory.category] || 0) + 1;
    totalImportance += memory.importance;
  }

  stats.avg_importance = stats.total > 0 ? Math.round((totalImportance / stats.total) * 100) / 100 : 0;

  return stats;
}

// Create and run server
const server = new Server(
  {
    name: "claude-memory-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "store_memory":
        result = await storeMemory(args as Parameters<typeof storeMemory>[0]);
        break;
      case "search_memories":
        result = await searchMemories(args as Parameters<typeof searchMemories>[0]);
        break;
      case "list_memories":
        result = await listMemories(args as Parameters<typeof listMemories>[0]);
        break;
      case "get_memory":
        result = await getMemory(args as Parameters<typeof getMemory>[0]);
        break;
      case "update_memory":
        result = await updateMemory(args as Parameters<typeof updateMemory>[0]);
        break;
      case "delete_memory":
        result = await deleteMemory(args as Parameters<typeof deleteMemory>[0]);
        break;
      case "memory_stats":
        result = await memoryStats(args as Parameters<typeof memoryStats>[0]);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Memory MCP Server running");
}

main().catch(console.error);
