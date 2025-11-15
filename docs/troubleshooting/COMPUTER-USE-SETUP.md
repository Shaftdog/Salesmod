# Computer Use Setup Guide

## Quick Test (Tools Available, No Execution)

1. **Add to `.env.local`:**
   ```bash
   COMPUTER_USE_ENABLED=true
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Test the status endpoint:**
   ```bash
   curl http://localhost:9002/api/agent/computer-use/status
   ```

4. **Ask the agent:**
   - "Check computer use status"
   - "Research competitor pricing at example.com" (will return that it's not fully implemented)

## Full Production Setup

### Step 1: Install Docker

Make sure Docker Desktop is installed and running.

### Step 2: Set Environment Variables

Add to `.env.local`:
```bash
ANTHROPIC_API_KEY=your_key_here
COMPUTER_USE_ENABLED=true
```

### Step 3: Start Computer Use Container

```bash
docker-compose -f docker-compose.computer-use.yml up -d
```

### Step 4: Access the Environment

- **VNC Viewer:** Connect to `localhost:5900`
- **Web Browser:** Open `http://localhost:6080/vnc.html`

### Step 5: Test It

The container will have:
- Ubuntu desktop environment
- Firefox browser
- Python with Anthropic SDK
- Terminal access

### Current Implementation Status

✅ **Implemented:**
- Computer Use tool definitions
- API endpoints for status checking
- Error handling and graceful degradation
- Agent tools integration

⚠️ **Not Implemented (Stub Only):**
- Actual tool execution (currently returns mock responses)
- Connection to Docker container
- Screenshot capture
- Mouse/keyboard control

### To Fully Implement

You would need to update `src/lib/agent/computer-use.ts` to:

1. Connect to the Docker container API
2. Execute actual mouse/keyboard commands
3. Capture screenshots
4. Return real results

This requires integrating with the Anthropic computer use API or building your own computer control layer.

## Alternative: Use Anthropic's Official Demo

Instead of custom integration, you could:

1. Use Anthropic's computer use demo directly
2. Call it as an external service from your agent
3. Return the results to the user

## Security Notes

⚠️ **Important:**
- Computer Use can execute arbitrary commands
- Never expose this to untrusted users
- Always run in isolated containers
- Review all actions before execution
- Consider implementing approval workflows

## Recommended Use Cases

Good for:
- Competitor research (pricing, features)
- Data extraction from websites
- Visual QA testing
- Screenshot-based analysis

Not recommended for:
- Sensitive operations
- Production systems
- Real-time interactions
- Mission-critical tasks
