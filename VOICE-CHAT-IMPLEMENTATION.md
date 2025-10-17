# 🎙️ Voice Chat Implementation Guide

## Overview

Add voice capabilities to your AI Account Manager Agent, enabling natural spoken conversations instead of (or in addition to) text chat.

---

## 🎯 Two Implementation Options

### Option 1: Browser-Based Voice (Recommended to Start)

**Complexity:** Easy (2-3 hours)  
**Cost:** Free  
**Quality:** Good  
**Use Case:** Desktop/browser conversations

**What you get:**
- 🎤 Click to speak (microphone button)
- 📝 Speech-to-text (your voice → text)
- 💬 Send to agent (existing chat API)
- 🔊 Text-to-speech (agent reads response aloud)
- 🔇 Mute toggle (silent mode)
- ✏️ Edit transcript before sending

---

### Option 2: Professional Voice with LiveKit/Twilio

**Complexity:** Advanced (1-2 weeks)  
**Cost:** ~$0.02-0.10 per minute  
**Quality:** Excellent  
**Use Case:** Phone calls, mobile, professional

**What you get:**
- 📞 Real phone calls with the agent
- 🎙️ Natural conversation flow
- 🔊 High-quality audio
- 📱 Call from phone (not just browser)
- 💬 Full transcriptions
- ⚡ Low latency
- 🔄 Interrupt agent mid-response

---

## 🚀 Option 1: Browser Voice Implementation

### Step 1: Add Voice Hooks

**Create:** `src/hooks/use-voice-chat.ts`

```typescript
import { useState, useEffect, useRef } from 'react';

export function useVoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }
    }
  }, []);

  const startListening = (onResult: (transcript: string) => void) => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return {
    isListening,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
```

---

### Step 2: Update Chat Component

**Update:** `src/components/agent/agent-chat.tsx`

Add to the component:

```typescript
import { useVoiceChat } from '@/hooks/use-voice-chat';
import { Mic, Volume2, VolumeX } from 'lucide-react';

export function AgentChat() {
  // Existing code...
  
  const {
    isListening,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceChat();

  // When agent responds, speak it aloud
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && voiceEnabled && !isLoading) {
      speak(lastMessage.content);
    }
  }, [messages, voiceEnabled, isLoading]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
        // Optionally auto-submit:
        // handleSubmit(new Event('submit') as any);
      });
    }
  };

  // In the render JSX, add voice buttons:
  return (
    <Card className="h-full flex flex-col">
      {/* ... existing header ... */}
      
      <CardContent>
        {/* ... existing messages ... */}
        
        {/* Voice-enabled input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            {/* Microphone button */}
            <Button
              type="button"
              variant={isListening ? "default" : "outline"}
              onClick={handleVoiceInput}
              className={isListening ? "animate-pulse" : ""}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Text input */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask the agent anything..."}
              disabled={isLoading || isListening}
            />

            {/* Send button */}
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
            </Button>

            {/* Voice output toggle */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? "Disable voice output" : "Enable voice output"}
            >
              {voiceEnabled ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
          
          {isListening && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              🎤 Listening... Speak now!
            </p>
          )}
          
          {isSpeaking && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              🔊 Speaking...
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## 🎯 User Experience

### How It Works:

1. **Click microphone** 🎤
   - Red pulse animation
   - "Listening..." appears
   - Browser asks for mic permission (first time)

2. **Speak your question**
   - "What are my goals?"
   - Your voice converts to text
   - Shows in input field

3. **Click send** (or auto-send)
   - Message goes to agent
   - Agent responds with streaming text

4. **Agent reads response** 🔊 (if voice enabled)
   - Text-to-speech reads aloud
   - "Speaking..." indicator shows
   - Can click to stop early

5. **You reply**
   - Click mic again
   - Or type manually
   - Mix voice and text!

---

## 💡 Advanced Features (Future)

### Voice Interruption:
```typescript
// Let user interrupt agent mid-response
const handleMicClick = () => {
  if (isSpeaking) {
    stopSpeaking(); // Stop agent talking
  }
  startListening(); // Start your turn
};
```

### Auto-Submit After Speaking:
```typescript
startListening((transcript) => {
  setInput(transcript);
  // Wait 1 second, then auto-submit
  setTimeout(() => {
    handleSubmit(new Event('submit') as any);
  }, 1000);
});
```

### Voice Activity Detection:
```typescript
// Show "agent is thinking" while processing
// Show waveform animation while speaking
// Visual feedback for better UX
```

### Different Voices:
```typescript
// Select agent voice
const voices = speechSynthesis.getVoices();
utterance.voice = voices.find(v => v.name.includes('Female')) || voices[0];
```

---

## 🔧 Implementation Steps

### If You Want Me to Build This:

**Time needed:** 2-3 hours

**What I'll add:**
1. Voice hooks file (`use-voice-chat.ts`)
2. Update agent-chat component
3. Add microphone button
4. Add voice toggle button  
5. Speech-to-text integration
6. Text-to-speech integration
7. Loading states and animations
8. Error handling for unsupported browsers

**Testing:**
- Works in Chrome, Edge, Safari
- Requires microphone permission
- Can be muted/unmuted
- Transcripts saved to chat history

---

## 🎊 What You'll Get

**Complete voice-enabled AI agent:**

**Voice Input:**
- Click mic → speak → converts to text → sends to agent
- Hands-free option (great for driving or multitasking)
- Edit transcript before sending (catch errors)

**Voice Output:**
- Agent reads responses aloud
- Toggle on/off anytime
- Professional text-to-speech
- Can stop mid-response

**Combined:**
- Natural conversation flow
- Mix voice and text freely
- Full transcripts in chat history
- Works on existing chat infrastructure

---

## 📊 Browser Support

**Excellent Support:**
- ✅ Chrome/Edge (best)
- ✅ Safari (good)
- ✅ Firefox (decent)

**Requirements:**
- Microphone access
- HTTPS (or localhost)
- Modern browser

**Fallback:**
- If unsupported → shows message
- Text chat still works
- No breaking changes

---

## 🎯 Next Steps

**Want voice chat?**

Say: **"Add voice chat to the agent"**

And I'll:
1. Create the voice hooks
2. Update the chat component
3. Add UI buttons
4. Implement speech-to-text
5. Implement text-to-speech
6. Test it works
7. Document how to use it

**Estimated time:** 2-3 hours for full implementation

Or save this file for later and come back when you're ready to add voice! 📝

---

## 💡 Why Voice is Powerful

**For Account Management:**
- Review cards while walking
- Dictate emails faster than typing
- Get briefings hands-free
- More natural interaction
- Multitask while getting updates

**Example:**
```
You: 🎤 "What needs my attention today?"
Agent: 🔊 "You have 6 pending action cards. The highest priority 
         is re-engaging iFund Cities - they haven't been contacted 
         in 999 days..."
You: 🎤 "Approve that email"
Agent: 🔊 "Done! Email approved and ready to send..."
```

**Feels like talking to a real assistant!** 🎙️🤖

---

**This file saved as:** `VOICE-CHAT-IMPLEMENTATION.md`

Come back when you're ready to add voice, and we'll make your AI agent truly conversational! 🎊

