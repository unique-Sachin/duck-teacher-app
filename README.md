# Evalyze

**AI-powered real-time performance evaluator for interviews, teaching, and enterprise training.**

## ⚙️ Configurati    - Use navbar controls to record audio\n    - Draw on the whiteboard\n    - Click \"Send to Evalyze\" to upload audio + drawing JSON to n8n
### Environment Variables
```bash
GOOG    - Use navbar controls to record audio
    - Draw on the whiteboard
    - Click "Send to Evalyze" to upload audio + drawing JSON to n8nAPI_KEY="your_gemini_api_key"
DEEPGRAM_API_KEY="your_deepgram_api_key"
```

### Adding New Interview Roles
To add a new interview position, edit `/src/config/roles.ts`:

```typescript
export const INTERVIEW_ROLES: Record<string, RoleConfig> = {
  // ... existing roles
  "your-new-role": {
    id: "your-new-role",
    title: "Your Role Title",
    icon: YourIcon, // from lucide-react
    description: "Role description",
    defaultTopic: "Default interview question",
    duration: "45-60 min",
    difficulty: "Intermediate",
    topics: ["Topic1", "Topic2"],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  }
};
```

The new role will automatically appear on the homepage and be accessible at `/interview/your-new-role`.

### Customization Options
- Role configurations: `src/config/roles.ts`
- Session store: `src/stores/session.ts`
- Recorder behavior: `src/hooks/useRecorder.ts`
- Excalidraw helpers: `src/lib/excalidraw.ts`
- UI theme: `tailwind.config.ts`

## 🧭 App Flow

1) **Homepage** (`app/page.tsx`): User selects an interview position
2) **Interview Session** (`app/interview/[role]/page.tsx`): Dynamic route based on selected role
   - Valid routes: `/interview/system-design`, `/interview/genai-developer`
   - Invalid routes automatically show 404**🚀 [App Usecase Explanation](https://drive.google.com/file/d/1Nsx_i3pnf3oYvQWtplvOMJKZKCvApSQ0/view?usp=drive_link)**

**🚀 [Google Doc Explanation](https://docs.google.com/document/d/1GCKxG5OvUUnqelSKGqJ6N5-gXcbgr8TTmbhx2Wiv9w8/edit?usp=sharing)**

Evalyze is an AI-powered platform that provides real-time performance evaluation for interviews, teaching sessions, and enterprise training. Practice technical interviews for System Design and Gen AI roles with instant AI analysis and comprehensive feedback.

## ✨ Features

- **Multiple Interview Roles**: System Design Engineer and Gen AI Developer positions
- **Audio Recording**: Real-time recording with pause/resume and live waveform visualization
- **Interactive Whiteboard**: Excalidraw integration for diagrams and visual explanations
- **AI-Powered Feedback**: Instant professional feedback on clarity, simplicity, and helpfulness
- **Detailed Analysis**: Get strengths, weaknesses, and reflection questions
- **Modern UI**: Beautiful interface with Tailwind, shadcn/ui, Radix, and Framer Motion

## 🎯 Interview Positions

### System Design Engineer
- Practice scalability and architecture questions
- Topics: Distributed Systems, Database Design, System Architecture
- Example: "Design a scalable URL shortener service"

### Gen AI Developer
- Master GenAI technical interviews
- Topics: LLMs, Prompt Engineering, RAG, AI Applications
- Example: "Explain how RAG (Retrieval Augmented Generation) works"

## 🛠 Tech stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4, shadcn/ui, Radix UI, Lucide Icons, Sonner toasts
- Excalidraw, MediaRecorder/Web Audio APIs
- Zustand state management
- Google Gemini 2.0 Flash (LangChain)
- Deepgram for audio transcription

## 🚀 Getting started

Prerequisites:
- Node.js 18+

Setup:
1) Install deps
```bash
npm install
```
2) Configure env
Create `.env.local` in the project root:
```bash
GOOGLE_API_KEY="your_gemini_api_key"
DEEPGRAM_API_KEY="your_deepgram_api_key"
```
3) Run dev server
```bash
npm run dev
```
Open http://localhost:3000

Build/serve:
```bash
npm run build
npm start
```

##  Configuration

- NEXT_PUBLIC_N8N_WEBHOOK_URL: public webhook the browser will post FormData to. Used in `src/lib/uploader.ts`.

Optional tweaks:
- Personas & session fields: `src/stores/session.ts`
- Recorder behavior: `src/hooks/useRecorder.ts`
- Excalidraw export helpers: `src/lib/excalidraw.ts`
- UI theme: `tailwind.config.ts`

## 🧭 App flow

1) Marketing home: `app/(marketing)/page.tsx`
2) Start Session: opens `app/session/page.tsx`
    - Initial modal collects email, topic, and persona
    - Use navbar controls to record audio
    - Draw on the whiteboard
    - Click “Send to Duck” to upload audio + drawing JSON to n8n
3) Result page: `app/result/page.tsx` shows feedback from n8n response

## 📁 Project structure (key parts)

```
app/
   (marketing)/           # Landing layout + page
   session/               # Whiteboard + recorder flow
      _components/
   result/                # Feedback UI
components/ui/           # shadcn/ui wrappers
src/
   context/RecorderContext.tsx
   hooks/useRecorder.ts
   lib/{excalidraw,uploader}.ts
   stores/session.ts      # Zustand store
```

##  Scripts

- dev: next dev --turbopack
- build: next build --turbopack
- start: next start
- lint: eslint

##  Notes on environment

`src/lib/uploader.ts` reads the webhook from `NEXT_PUBLIC_N8N_WEBHOOK_URL`. If unset, it falls back to a default test URL in code. Prefer configuring your own URL via `.env.local`.

## 📄 License

MIT — see LICENSE.

##  Support

Open an issue or reach the maintainer.
