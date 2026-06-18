# DORAEMON - Personal AI Life Companion System

> **"A true friend doesn't let you fail."**

DORAEMON is a voice-first, AI-powered life companion that combines the narrative immersion of Solo Leveling's System, the emotional loyalty of Doraemon, and ruthless accountability for users with ADHD. It doesn't just remind — it persists, negotiates, adapts, and physically blocks procrastination until daily quests are complete.

## Features

### Core Systems

- **Solo Leveling Status HUD** - Gamified status window with levels, XP, stats (INT, AGI, STR, FAME), streaks, and grades
- **Voice Chat with Doraemon** - Talk to your AI companion using Web Speech API with natural TTS responses
- **Quest Management** - Story Quests, Daily Quests, Side Quests, and Habits with full CRUD
- **Weekly Planning (Sunday Ritual)** - AI-powered goal breakdown into structured weekly plans
- **Focus Mode with Anti-Escape** - Blocking screen that prevents you from quitting mid-task
- **Negotiation Mode** - When you try to quit, Doraemon negotiates instead of just accepting
- **Weekly Boss Fight** - Epic Friday review with stat gains, grades, and progress reports
- **Gadget System** - Unlockable tools at different levels (Anywhere Door, Time Cloth, Memory Bread, etc.)
- **Emotional Intelligence** - Adaptive personality modes (Cheerleader, Drill Sergeant, Therapist, Best Friend, Silent Guardian)
- **ADHD Configuration** - Adjustable severity settings and hyperfocus protection

### Tech Stack (Zero Budget)

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React + TypeScript + Tailwind CSS + Framer Motion | Free |
| Backend | Python + FastAPI | Free |
| Database | SQLite (built-in) | Free |
| Voice Input | Web Speech API (browser native) | Free |
| Voice Output | Web Speech Synthesis API | Free |
| LLM | Groq API (Llama 3) with local mock fallback | Free tier |
| Styling | Tailwind CSS + shadcn/ui components | Free |

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+ (for frontend development only)

### Installation

1. **Install Python dependencies:**
```bash
pip install fastapi uvicorn pydantic
```

2. **(Optional) For LLM features, set your Groq API key:**
```bash
export GROQ_API_KEY="your_api_key_here"
```
If not set, Doraemon will use intelligent mock responses.

3. **Start the application:**
```bash
python start.py
```

The application will be available at `http://localhost:8000`

### Development Mode

```bash
# Start backend with hot reload
python start.py --dev

# Start frontend development server separately
python start.py --frontend

# Start both (advanced)
python start.py --fullstack
```

## Project Structure

```
doraemon/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── database.py             # SQLite database layer
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── routers/
│   │   ├── user.py             # User stats & profile
│   │   ├── quests.py           # Quest CRUD & daily briefing
│   │   ├── planning.py         # Weekly planning
│   │   ├── sessions.py         # Focus sessions & escape handling
│   │   └── chat.py             # Doraemon chat interface
│   ├── services/
│   │   └── llm_service.py      # LLM integration (Groq + mock)
│   └── static/                 # Built frontend files
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Global styles & animations
│   │   ├── services/
│   │   │   └── api.ts          # API client
│   │   ├── hooks/
│   │   │   └── useVoice.ts     # Voice input/output hook
│   │   ├── types/
│   │   │   └── speech.d.ts     # Web Speech API types
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── MainLayout.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── StatusBar.tsx
│   │   └── pages/
│   │       ├── Dashboard.tsx   # Status HUD & daily briefing
│   │       ├── Quests.tsx      # Quest management
│   │       ├── WeeklyPlanning.tsx  # Sunday ritual
│   │       ├── FocusMode.tsx   # Focus session with anti-escape
│   │       ├── BossFight.tsx   # Weekly review
│   │       ├── DoraemonChat.tsx    # Voice chat
│   │       └── Settings.tsx    # Configuration
│   └── package.json
├── start.py                    # Startup script
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Get user profile & stats |
| `/api/stats` | POST | Update user stats |
| `/api/xp` | POST | Add XP |
| `/api/mood-check` | POST | Update emotional state |
| `/api/quests` | GET | List quests (with filters) |
| `/api/quests` | POST | Create quest |
| `/api/quests/{id}` | GET/PATCH/DELETE | Quest operations |
| `/api/quests/{id}/complete` | POST | Complete quest |
| `/api/daily-briefing` | GET | Morning status window |
| `/api/weekly-plan` | GET/POST | Weekly planning |
| `/api/weekly-report` | GET | Boss fight report |
| `/api/session/start` | POST | Start focus session |
| `/api/session/active` | GET | Get active session |
| `/api/session/{id}/complete` | POST | Complete session |
| `/api/escape-attempt` | POST | Log escape attempt |
| `/api/negotiate` | POST | Negotiate with Doraemon |
| `/api/chat` | POST | Text chat |
| `/api/chat/voice` | POST | Voice chat |
| `/api/doraemon/status` | GET | Doraemon status |
| `/api/doraemon/mode` | POST | Set personality mode |
| `/api/gadgets` | GET | List all gadgets |
| `/api/gadgets/unlocked` | GET | Unlocked gadgets |

## Doraemon Personality Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Cheerleader** | Motivated state | High energy, celebrates small wins |
| **Drill Sergeant** | Avoidant state | No mercy, blocks everything, forces 5-min starts |
| **Therapist** | Stressed state | Calm, validates feelings, reduces pressure |
| **Best Friend** | Sad/depressed | Gentle, lowers expectations, "just show up" |
| **Silent Guardian** | Hyperfocused | Disappears, monitors, only interrupts for health |

## Implementation Roadmap

### Phase 1: Core Companion (Complete)
- Voice input/output
- Weekly planning + timetable generation
- Daily briefing status window
- Basic quest tracking
- SQLite storage

### Phase 2: The Enforcer
- Escape attempt detection + blocking screen
- Negotiation mode with LLM
- Session tracking + XP system

### Phase 3: The Friend
- Emotional state detection
- Adaptive Doraemon personality modes
- Mid-session smart reminders
- Hyperfocus protection

### Phase 4: The Legend
- Weekly boss fight screen
- Gadget unlock system
- Adaptive difficulty

## Configuration

Set environment variables in `.env` or your shell:

```bash
# LLM API (optional - mock mode works without)
GROQ_API_KEY=your_groq_api_key

# Server
PORT=8000
```

## License

Open Source - Built with zero budget for ADHD hackers who refuse to give up.

---

**"The only productivity app that cares enough to annoy you until you win."**
