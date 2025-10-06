# Interview Components

This directory contains reusable components for all interview pages.

## Components Overview

### 1. InterviewNavbar
**File:** `InterviewNavbar.tsx`

A slim, reusable navbar for interview pages with app logo, timer, and status indicators.

**Props:**
```typescript
{
  title: string;                    // Interview title
  subtitle?: string;                // Optional subtitle
  status?: InterviewStatus;         // Current status
  statusText?: string;              // Custom status text
  showTimer?: boolean;              // Show/hide timer
  remainingTime?: number;           // Time in seconds
  isTimeUp?: boolean;               // Time's up indicator
  onHomeClick?: () => void;         // Custom home handler
  className?: string;               // Additional styles
  rightContent?: React.ReactNode;   // Custom right side content
}
```

**Status Types:**
- `idle` - Not started (gray)
- `listening` - AI listening (green)
- `thinking` - AI processing (yellow)
- `speaking` - AI speaking (blue)
- `connected` - Connected (green)
- `disconnected` - Not connected (red)
- `recording` - Recording (red)
- `processing` - Processing (yellow)

**Usage Example:**
```tsx
<InterviewNavbar
  title="Gen AI Developer Interview"
  subtitle="Voice-based interview with AI"
  status={agentStatus}
  statusText={getStatusText()}
  showTimer={isConnected}
  remainingTime={remainingTime}
  isTimeUp={isTimeUp}
/>
```

---

### 2. InterviewParticipants
**File:** `InterviewParticipants.tsx`

Google Meet-style participant cards with status indicators, avatars, and animations.

**Props:**
```typescript
{
  interviewerStatus: {
    status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected' | 'disconnected';
    isMuted: boolean;
    isVideoOn: boolean;
  };
  intervieweeStatus: {
    status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected' | 'disconnected';
    isMuted: boolean;
    isVideoOn: boolean;
  };
  layout?: 'vertical' | 'horizontal';  // Default: 'vertical'
  interviewerName?: string;             // Default: 'AI Interviewer'
  intervieweeName?: string;             // Default: 'You'
  className?: string;
}
```

**Features:**
- Compact aspect-video (16:9) cards
- Animated pulsing rings for active states
- Mute/video indicators
- Status badges with color coding
- Smooth framer-motion animations

**Usage Example:**
```tsx
<InterviewParticipants
  interviewerStatus={{
    status: agentStatus,
    isMuted: false,
    isVideoOn: false
  }}
  intervieweeStatus={{
    status: isConnected ? 'connected' : 'disconnected',
    isMuted: isMuted,
    isVideoOn: false
  }}
  layout="vertical"
/>
```

---

### 3. LiveTranscript
**File:** `LiveTranscript.tsx`

Real-time transcript display with message bubbles and auto-scroll.

**Props:**
```typescript
{
  messages: TranscriptMessage[];        // Array of messages
  interimTranscript?: {                 // Optional interim transcript
    content: string;
    isFinal: boolean;
  } | null;
  agentStatus?: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected';
  title?: string;                       // Default: "Live Transcript"
  emptyMessage?: string;                // Empty state message
  showMessageCount?: boolean;           // Show message count badge
  className?: string;
  agentColor?: 'blue' | 'green' | 'orange';      // Default: 'blue'
  userColor?: 'purple' | 'pink' | 'indigo';      // Default: 'purple'
  autoScroll?: boolean;                 // Default: true
}

interface TranscriptMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}
```

**Features:**
- Auto-scroll to latest message
- Interim transcript with dashed border and pulse animation
- Color-coded message bubbles
- Timestamps for each message
- Smooth animations with AnimatePresence
- Empty state handling

**Usage Example:**
```tsx
<LiveTranscript
  messages={transcript}
  interimTranscript={interimTranscript ? {
    content: interimTranscript,
    isFinal: isInterimFinal
  } : null}
  agentStatus={agentStatus}
  title="Live Transcript"
  emptyMessage="Transcript will appear here once the interview starts..."
  showMessageCount={true}
  agentColor="blue"
  userColor="purple"
  autoScroll={true}
/>
```

---

## Interview Page Layouts

### Standard Layout Structure

All interview pages follow this three-column layout:

```
┌────────────────────────────────────────────────────────────┐
│ InterviewNavbar (slim, with timer and status)              │
├────────────┬─────────────────────────────────┬─────────────┤
│  Left      │       Middle (Main Content)     │    Right    │
│  (w-80)    │       (flex-1)                  │   (w-96)    │
│            │                                 │             │
│ Interview  │                                 │    Live     │
│ Partici-   │   Whiteboard / Video / etc      │  Transcript │
│ pants      │                                 │             │
│            │                                 │             │
│ Controls   │                                 │             │
│            │                                 │             │
│ Info       │                                 │             │
└────────────┴─────────────────────────────────┴─────────────┘
```

### Example Pages:

1. **GenAI Developer Interview** (`/interview/genai-developer`)
   - Left: Participant cards + Control buttons + Info card
   - Middle: (Reserved for future content)
   - Right: Live transcript

2. **System Design Interview** (`/interview/system-design`)
   - Left: Participant cards + Control buttons + Info card
   - Middle: Excalidraw whiteboard
   - Right: Live transcript

---

## Integration with Deepgram Voice Agent

All interviews use the `useDeepgramVoiceAgent` hook:

```tsx
const {
  isConnected,
  agentStatus,
  transcript,
  interimTranscript,
  isInterimFinal,
  remainingTime,
  isTimeUp,
  startConnection,
  stopConnection,
} = useDeepgramVoiceAgent({
  roleId: 'genai-developer',      // or 'system-design'
  interviewDuration: 60,           // minutes
  onStatusChange: (status) => {},
  onTranscriptUpdate: (message) => {},
  onError: (error) => {},
  onInterviewComplete: (analysis) => {},
  onTimeWarning: (minutes) => {},
});
```

---

## Design Principles

1. **Consistency**: All interview pages use the same components and layout
2. **Responsiveness**: Components adapt to different screen sizes
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Performance**: Optimized re-renders with React memo and careful state management
5. **Dark Mode**: All components support light/dark themes
6. **Animations**: Smooth transitions with Framer Motion

---

## Future Enhancements

- [ ] Video feed integration for participant cards
- [ ] Screen sharing support
- [ ] Code editor integration
- [ ] Drawing/annotation tools
- [ ] Save/export transcript functionality
- [ ] Multi-language support
- [ ] Recording playback features
