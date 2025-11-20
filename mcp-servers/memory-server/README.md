# Claude Memory MCP Server

Long-term memory for Claude Code using Supabase pgvector for semantic search.

## Features

- **Semantic search** - Find memories by meaning, not just keywords
- **Project isolation** - Memories tagged by project with global scope option
- **Importance scoring** - High-importance memories surface first
- **Categories** - Organize memories: decisions, patterns, preferences, lessons
- **Access tracking** - See which memories are most useful
- **TTL support** - Optional expiration for temporary memories

## Installation

### 1. Run the Supabase migration

Apply the migration to your Supabase database:

```bash
# From your project root
supabase db push

# Or apply directly
psql $DATABASE_URL < supabase/migrations/20251120000000_add_claude_memories.sql
```

### 2. Install the MCP server globally

```bash
# Copy to your global Claude config
mkdir -p ~/.claude/mcp-servers/memory-server
cp -r /path/to/mcp-servers/memory-server/* ~/.claude/mcp-servers/memory-server/

# Install dependencies
cd ~/.claude/mcp-servers/memory-server
npm install
npm run build
```

### 3. Configure environment variables

Create `~/.claude/mcp-servers/memory-server/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

### 4. Add to Claude Code settings

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/home/YOUR_USERNAME/.claude/mcp-servers/memory-server/dist/index.js"]
    }
  }
}
```

Or add via CLI:
```bash
claude mcp add memory node /home/YOUR_USERNAME/.claude/mcp-servers/memory-server/dist/index.js
```

### 5. Restart Claude Code

The memory tools will now be available in all your projects.

## Usage

### Store a memory

```
Store this as a memory: "Always use Prisma migrations for schema changes in this project"
```

### Search memories

```
Search my memories for database migration patterns
```

### List memories

```
List my recent memories for this project
```

### Categories

- `decision` - Architectural or implementation decisions
- `pattern` - Coding patterns and conventions
- `preference` - User preferences and style
- `lesson` - Lessons learned from bugs/issues
- `context` - Project context and background
- `general` - Everything else

### Global vs Project memories

- By default, memories are tagged with the current directory name
- Use `project: "global"` for cross-project memories
- Searches include both project and global memories by default

## Tools

| Tool | Description |
|------|-------------|
| `store_memory` | Save a new memory with embedding |
| `search_memories` | Semantic search for relevant memories |
| `list_memories` | Browse memories with filters |
| `get_memory` | Get a specific memory by ID |
| `update_memory` | Update memory content/metadata |
| `delete_memory` | Remove a memory |
| `memory_stats` | Get statistics about stored memories |

## Architecture

```
Claude Code → MCP Server → Supabase (pgvector)
                ↓
           OpenAI API
         (embeddings)
```

- Embeddings: OpenAI text-embedding-ada-002 (1536 dimensions)
- Vector search: IVFFLAT index with cosine similarity
- Storage: Supabase PostgreSQL with pgvector extension

## Cost Considerations

- **Embeddings**: ~$0.0001 per 1K tokens (very cheap)
- **Storage**: Standard Supabase pricing
- **No context window usage**: Memories retrieved on-demand

Typical usage: < $1/month for hundreds of memories.
