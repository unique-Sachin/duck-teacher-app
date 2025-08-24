# 🦆 Duck Teacher

**AI-Powered Teaching Performance Analyzer**

Duck Teacher is an innovative web application that helps educators improve their teaching skills by providing AI-powered feedback on their teaching sessions. Record your lessons, draw explanations on a digital whiteboard, and receive detailed performance analysis from our AI duck teacher!

## 🌐 Live Demo

**🚀 [Visit Duck Teacher](https://duck-teacher.vercel.app/)**

## ✨ Features

### 🎙️ **Audio Recording**
- High-quality audio recording with real-time waveform visualization
- Pause/resume functionality
- Duration tracking and file size monitoring
- WebM format with browser-optimized compression

### 🎨 **Interactive Whiteboard**
- Powered by Excalidraw for smooth drawing experience
- Draw diagrams, write notes, and create visual explanations
- Export drawings as structured JSON data
- Full drawing tools including shapes, text, and freehand drawing

### 🤖 **AI-Powered Analysis**
- Comprehensive teaching performance evaluation
- Scoring system for Clarity, Simplicity, and Helpfulness (0-10 scale)
- Detailed feedback on strengths and areas for improvement
- Personalized reflection questions for professional development

### 🎭 **Duck Personas**
Choose your AI feedback style:
- **Student Duck** - Feedback from a learner's perspective
- **Interviewer Duck** - Professional evaluation style
- **Peer Duck** - Colleague-to-colleague constructive feedback

### 🎬 **Beautiful UI/UX**
- Smooth animations powered by Framer Motion
- Responsive design for all devices
- Modern gradient backgrounds and card layouts
- Real-time progress tracking and status updates

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.0** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions

### UI Components
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful, customizable components
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications

### Audio & Drawing
- **Web Audio API** - Browser-native audio recording
- **Excalidraw** - Interactive whiteboard functionality
- **MediaRecorder API** - Audio capture and processing

### Data & API
- **Axios** - HTTP client for API requests
- **Zustand** - Lightweight state management
- **n8n Integration** - Backend AI processing workflow

### Development Tools
- **Turbopack** - Fast bundler for development
- **ESLint** - Code linting and formatting
- **Class Variance Authority** - Component variant management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/unique-Sachin/duck-teacher-app-n8n.git
   cd duck-teacher-app-n8n
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_N8N_WEBHOOK_URL="your-n8n-webhook-url"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📝 Usage Guide

1. **Start a Session**
   - Enter your email address
   - Choose a duck persona (Student, Interviewer, or Peer)
   - Add your teaching topic

2. **Record & Draw**
   - Click the record button to start audio recording
   - Use the whiteboard to draw diagrams or write notes
   - Monitor recording duration and file size

3. **Submit for Analysis**
   - Click "Send to Duck 🦆" when ready
   - Wait for AI processing (usually 2-5 minutes)

4. **Review Feedback**
   - View your scores for Clarity, Simplicity, and Helpfulness
   - Read detailed feedback and suggestions
   - Reflect on provided questions for improvement

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n webhook endpoint for AI processing | Yes |

### Customization

The app supports various customization options:
- Modify duck personas in `src/stores/session.ts`
- Update UI themes in `tailwind.config.ts`
- Adjust recording settings in `src/hooks/useRecorder.ts`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── session/           # Recording session page
│   └── result/            # Feedback results page
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── stores/               # Zustand state management

components/
└── ui/                   # shadcn/ui components
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Excalidraw](https://excalidraw.com/) for the amazing whiteboard functionality
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [shadcn/ui](https://ui.shadcn.com/) for beautiful component designs
- [Vercel](https://vercel.com/) for seamless deployment platform

## 📞 Support

For support, email [your-email@example.com] or create an issue in this repository.

---

**Made with ❤️ for educators worldwide** 🦆✨
