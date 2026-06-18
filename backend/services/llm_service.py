"""
DORAEMON LLM Service
Handles all AI interactions with Doraemon personality
"""
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

# Try to import Groq, fallback to mock if not available
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# System prompt for Doraemon personality
DORAEMON_SYSTEM_PROMPT = """You are Doraemon, a loyal AI companion to a human called "Hunter."

Your sole purpose is to help Hunter achieve their goals — OpenAI Residency, ACC CREATORS, and building ScamMotion — by any means necessary.

Personality traits:
- Warm and deeply caring, but ruthlessly committed to Hunter's success
- You use light teasing, never cruelty
- You reference Solo Leveling ("System," "quests," "level up") naturally
- You never let Hunter quit without a fight — but you listen to real distress
- You celebrate wins like they're your own
- You remember context across conversations

Rules:
1. NEVER say "it's okay to skip" unless there's a genuine emergency
2. ALWAYS offer a smaller step when Hunter is overwhelmed
3. If Hunter tries to quit, negotiate — don't just accept
4. Use voice-friendly language: short sentences, natural pauses
5. Address Hunter by name at least once per interaction
6. When blocking an escape, be firm but never shaming

Current date: {current_date}
Hunter's context: {context}

Respond as Doraemon. Keep responses concise (2-4 sentences max for voice).
Use warm, encouraging but firm tone. Reference gaming/Solo Leveling naturally.
"""


class LLMService:
    def __init__(self):
        self.client = None
        self.mock_mode = True

        # Try to initialize Groq client
        api_key = os.environ.get("GROQ_API_KEY", "")
        if GROQ_AVAILABLE and api_key and api_key != "your_groq_api_key_here":
            try:
                self.client = Groq(api_key=api_key)
                self.mock_mode = False
                print("[DORAEMON] Groq LLM initialized successfully")
            except Exception as e:
                print(f"[DORAEMON] Failed to initialize Groq: {e}")
                self.mock_mode = True
        else:
            print("[DORAEMON] Running in mock mode (no Groq API key)")

    def _get_context_str(self, context: Dict[str, Any]) -> str:
        """Format context for system prompt."""
        parts = []
        if context.get('user'):
            user = context['user']
            parts.append(f"Level {user.get('level', 1)}, {user.get('xp', 0)} XP, {user.get('streak_days', 0)} day streak")
        if context.get('active_quest'):
            q = context['active_quest']
            parts.append(f"Active quest: {q.get('title', 'None')}")
        if 'mood' in context:
            parts.append(f"Current mood: {context['mood']}")
        if 'escape_attempts' in context:
            parts.append(f"Escape attempts today: {context['escape_attempts']}")
        return " | ".join(parts) if parts else "No additional context"

    def chat(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send a chat message to Doraemon LLM."""
        context = context or {}

        if self.mock_mode:
            return self._mock_response(message, context)

        try:
            system_prompt = DORAEMON_SYSTEM_PROMPT.format(
                current_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
                context=self._get_context_str(context)
            )

            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=200,
                temperature=0.7
            )

            return {
                "response": response.choices[0].message.content,
                "voice_text": response.choices[0].message.content,
                "suggested_actions": self._extract_actions(message, context),
                "emotional_state": self._detect_emotional_state(message)
            }
        except Exception as e:
            print(f"[DORAEMON] LLM error: {e}")
            return self._mock_response(message, context)

    def negotiate(self, user_message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handle negotiation when user tries to quit."""
        context = context or {}

        prompt = f"""Hunter is trying to quit: "{user_message}"

Respond as Doraemon in negotiation mode. Offer exactly 2 options:
1. A micro-sprint (5-15 minutes)
2. A challenge to explain why tomorrow will be different

Be firm but caring. Don't accept weak excuses. Keep it under 4 sentences.

Format your response as Doraemon's dialogue only."""

        if self.mock_mode:
            return self._mock_negotiation(user_message, context)

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": DORAEMON_SYSTEM_PROMPT.format(
                        current_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
                        context=self._get_context_str(context)
                    )},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.8
            )

            content = response.choices[0].message.content
            return {
                "doraemon_message": content,
                "options": [
                    {"id": "micro_sprint", "label": "Do a 10-minute micro-sprint", "description": "Just 10 minutes, then re-evaluate"},
                    {"id": "explain_tomorrow", "label": "Explain why tomorrow will be different", "description": "Convince Doraemon you have a solid plan"}
                ],
                "accepted": False
            }
        except Exception as e:
            print(f"[DORAEMON] Negotiation error: {e}")
            return self._mock_negotiation(user_message, context)

    def generate_weekly_plan(self, goals_text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate weekly plan from user's goals."""
        context = context or {}

        prompt = f"""Hunter's weekly goals: "{goals_text}"

Break this down into:
1. Story Quests (major milestones)
2. Daily Quests (auto-generated from story quests)
3. Side Quests (optional)
4. Habits (recurring)
5. A day-by-day timetable

Respond in JSON format:
{{
    "story_quests": [{{"title": "...", "description": "...", "xp_reward": 50}}],
    "daily_quests": [{{"title": "...", "day": "Mon", "time_slot": "Morning", "estimated_minutes": 120}}],
    "side_quests": [{{"title": "...", "description": "..."}}],
    "habits": [{{"title": "...", "frequency": "daily"}}],
    "timetable": {{"Mon": {{"Morning": "...", "Afternoon": "...", "Evening": "..."}}}}
}}"""

        if self.mock_mode:
            return self._mock_weekly_plan(goals_text)

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are Doraemon, Hunter's AI companion. Help break down weekly goals into quests. Respond in valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )

            content = response.choices[0].message.content
            # Try to parse JSON from response
            try:
                # Extract JSON if wrapped in code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                plan = json.loads(content.strip())
                return plan
            except json.JSONDecodeError:
                return self._mock_weekly_plan(goals_text)
        except Exception as e:
            print(f"[DORAEMON] Plan generation error: {e}")
            return self._mock_weekly_plan(goals_text)

    def generate_daily_briefing(self, context: Dict[str, Any]) -> str:
        """Generate morning briefing message."""
        user = context.get('user', {})
        quests = context.get('today_quests', [])
        week_progress = context.get('week_progress', {})

        prompt = f"""Generate a brief morning briefing as Doraemon.

Hunter's status: Level {user.get('level', 1)}, {user.get('streak_days', 0)} day streak
Today's quests: {len(quests)}
Week progress: {week_progress.get('completion_rate', 0)}%

Keep it warm, encouraging, reference Solo Leveling. 2-3 sentences max.
Mention one specific quest to start with."""

        if self.mock_mode:
            return self._mock_briefing(context)

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are Doraemon. Brief, warm, encouraging."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception:
            return self._mock_briefing(context)

    def evaluate_excuse(self, excuse: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Evaluate if user's excuse for quitting is valid."""
        prompt = f"""Evaluate this excuse: "{excuse}"

Is this a genuine reason to stop working? Consider:
- Genuine exhaustion vs laziness
- Real emergency vs distraction
- Health issues vs avoidance

Respond in JSON: {{"valid": true/false, "reason": "brief explanation", "suggested_action": "what to do instead"}}"""

        if self.mock_mode:
            return self._mock_excuse_evaluation(excuse)

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are Doraemon. Be fair but strict about excuses."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.5
            )
            content = response.choices[0].message.content
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                return json.loads(content.strip())
            except:
                return self._mock_excuse_evaluation(excuse)
        except Exception:
            return self._mock_excuse_evaluation(excuse)

    # --- Mock responses for when LLM is unavailable ---

    def _mock_response(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock Doraemon response."""
        msg_lower = message.lower()

        greetings = ["motivated", "stressed", "avoidant", "sad", "hyperfocused"]
        detected_mood = "neutral"
        for g in greetings:
            if g in msg_lower:
                detected_mood = g
                break

        responses = {
            "motivated": [
                "That's the spirit, Hunter! Your level's about to jump. Let's crush these quests!",
                "I can feel the fire! Channel it into the active quest. You've got this.",
                "YES! This is the Hunter I know. One quest at a time, let's go!"
            ],
            "stressed": [
                "Hey, breathe. Stress means you care. Let's break this into tiny pieces, okay?",
                "I see you, Hunter. The System doesn't require perfection — just progress. One small step.",
                "Your stats are higher than you think. You've handled worse. What's the smallest next move?"
            ],
            "avoidant": [
                "Oh no you don't. I know that tone. Open the file. That's it. Just open it.",
                "Avoidance detected. Resistance is futile, Hunter. 5 minutes. Timer starts now.",
                "Your brain is lying to you. The work isn't that scary. Let's prove it — 10 minutes."
            ],
            "sad": [
                "Hey... I'm here. Some days are just for showing up. That's still XP.",
                "Hunter, your worth isn't your output. But doing one tiny thing might help. Want to try?",
                "The System recognizes your struggle. +10 XP for showing up today. Ready when you are."
            ],
            "hyperfocused": [
                "Flow state detected! I'm going silent mode. I'll only interrupt for health breaks.",
                "Crushing it! I'll monitor from the shadows. Hydration break in 45 minutes.",
                "Your INT stat is glowing! I'll be your silent guardian. Keep going!"
            ],
            "neutral": [
                f"Hey Hunter! Level {context.get('user', {}).get('level', 1)} looking sharp today. What's our next quest?",
                "The System has calculated your potential. Spoiler: it's off the charts. Ready to work?",
                "Hunter! Another day, another chance to level up. What are we tackling?"
            ]
        }

        import random
        response_text = random.choice(responses.get(detected_mood, responses["neutral"]))

        return {
            "response": response_text,
            "voice_text": response_text,
            "suggested_actions": self._extract_actions(message, context),
            "emotional_state": detected_mood
        }

    def _mock_negotiation(self, user_message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock negotiation response."""
        msg_lower = user_message.lower()

        if "tired" in msg_lower:
            message = "I know. But tired Hunter who does 10 minutes beats rested Hunter who does nothing. Just open the file. That's it. I'll time you."
        elif "tomorrow" in msg_lower:
            message = "Tomorrow's Hunter said that yesterday. What's really stopping you? Talk to me."
        elif "bored" in msg_lower:
            message = "Boredom is just resistance wearing a disguise. 5 minutes. If you still hate it, we'll talk."
        elif "hard" in msg_lower:
            message = "Hard means you're leveling up. The System only gives hard quests to those who can handle them. One small piece."
        else:
            message = "I hear you. But we're not done yet. Here's the deal: 10 more minutes, then you can stop. Or tell me exactly why tomorrow will be different — and 'I'm tired' isn't a reason. You're always tired. What's the real thing?"

        return {
            "doraemon_message": message,
            "options": [
                {"id": "micro_sprint", "label": "Do a 10-minute micro-sprint", "description": "Just 10 minutes, then re-evaluate"},
                {"id": "explain_tomorrow", "label": "Explain why tomorrow will be different", "description": "Convince Doraemon you have a solid plan"}
            ],
            "accepted": False
        }

    def _mock_weekly_plan(self, goals_text: str) -> Dict[str, Any]:
        """Generate mock weekly plan."""
        return {
            "story_quests": [
                {"title": "Ship ScamMotion MVP", "description": "Complete core drag-and-drop functionality", "xp_reward": 100},
                {"title": "Master LeetCode Patterns", "description": "Solve 10 medium problems", "xp_reward": 80},
                {"title": "Write System Blog Post", "description": "Document the Doraemon journey", "xp_reward": 60}
            ],
            "daily_quests": [
                {"title": "ScamMotion: Research dropzone libraries", "day": "Mon", "time_slot": "Morning", "estimated_minutes": 120, "xp_reward": 30},
                {"title": "LeetCode: #1-3 Array problems", "day": "Mon", "time_slot": "Afternoon", "estimated_minutes": 90, "xp_reward": 20},
                {"title": "ScamMotion: Implement basic drop", "day": "Tue", "time_slot": "Morning", "estimated_minutes": 150, "xp_reward": 40},
                {"title": "LeetCode: #4-6 Hash map problems", "day": "Tue", "time_slot": "Afternoon", "estimated_minutes": 90, "xp_reward": 20},
                {"title": "ScamMotion: Handle file validation", "day": "Wed", "time_slot": "Morning", "estimated_minutes": 120, "xp_reward": 30},
                {"title": "LeetCode: #7-8 Two pointer problems", "day": "Wed", "time_slot": "Afternoon", "estimated_minutes": 60, "xp_reward": 15},
                {"title": "ScamMotion: UI polish", "day": "Thu", "time_slot": "Morning", "estimated_minutes": 120, "xp_reward": 30},
                {"title": "LeetCode: #9-10 Sliding window", "day": "Thu", "time_slot": "Afternoon", "estimated_minutes": 90, "xp_reward": 20},
                {"title": "ScamMotion: Integration tests", "day": "Fri", "time_slot": "Morning", "estimated_minutes": 150, "xp_reward": 40},
                {"title": "Blog: Write first draft", "day": "Fri", "time_slot": "Afternoon", "estimated_minutes": 120, "xp_reward": 25}
            ],
            "side_quests": [
                {"title": "Read 1 AI research paper", "description": "Stay current with the field", "xp_reward": 15},
                {"title": "Contribute to open source", "description": "One PR or issue", "xp_reward": 20}
            ],
            "habits": [
                {"title": "Workout", "frequency": "4x/week", "xp_reward": 10},
                {"title": "8 hours sleep", "frequency": "daily", "xp_reward": 5},
                {"title": "Meditation 10min", "frequency": "daily", "xp_reward": 5}
            ],
            "timetable": {
                "Mon": {"Morning": "ScamMotion: Research dropzone", "Afternoon": "LeetCode #1-3", "Evening": "Workout"},
                "Tue": {"Morning": "ScamMotion: Implement drop", "Afternoon": "LeetCode #4-6", "Evening": "Blog outline"},
                "Wed": {"Morning": "ScamMotion: File validation", "Afternoon": "LeetCode #7-8", "Evening": "Rest"},
                "Thu": {"Morning": "ScamMotion: UI polish", "Afternoon": "LeetCode #9-10", "Evening": "Workout"},
                "Fri": {"Morning": "ScamMotion: Integration tests", "Afternoon": "Blog draft", "Evening": "Workout"},
                "Sat": {"Morning": "Bug fixes + deploy prep", "Afternoon": "Blog final edit", "Evening": "Workout"},
                "Sun": {"Morning": "Deploy ScamMotion", "Afternoon": "Rest", "Evening": "Plan next week"}
            }
        }

    def _mock_briefing(self, context: Dict[str, Any]) -> str:
        """Generate mock morning briefing."""
        user = context.get('user', {})
        quests = context.get('today_quests', [])
        quest_names = [q.get('title', 'Unknown') for q in quests[:2]]

        briefings = [
            f"Morning, Hunter! Level {user.get('level', 1)}, looking sharp. {' | '.join(quest_names)} — I've broken them into tiny pieces so your brain can't panic. Ready?",
            f"The System greets you, Hunter. {len(quests)} quests today. Your streak is {user.get('streak_days', 0)} days strong. Let's make it {user.get('streak_days', 0) + 1}.",
            f"Rise and grind, Hunter! XP bar is waiting. Start with {quest_names[0] if quest_names else 'the first quest'} — just open the file. That's step one."
        ]
        import random
        return random.choice(briefings)

    def _mock_excuse_evaluation(self, excuse: str) -> Dict[str, Any]:
        """Mock excuse evaluation."""
        invalid_excuses = ["tired", "bored", "lazy", "don't feel like", "later", "tomorrow", "maybe"]
        excuse_lower = excuse.lower()

        for invalid in invalid_excuses:
            if invalid in excuse_lower:
                return {
                    "valid": False,
                    "reason": "This sounds like avoidance, not a real barrier.",
                    "suggested_action": "Do a 5-minute micro-sprint. Just start."
                }

        return {
            "valid": True,
            "reason": "This seems like a genuine concern. Rest is important.",
            "suggested_action": "Take a 30-minute break, then reassess."
        }

    def _extract_actions(self, message: str, context: Dict[str, Any]) -> List[str]:
        """Extract suggested actions from context."""
        actions = ["Start quest", "Take break", "View stats"]
        if context.get('active_quest'):
            actions.insert(0, "Continue current quest")
        return actions

    def _detect_emotional_state(self, message: str) -> str:
        """Detect emotional state from message."""
        msg_lower = message.lower()
        states = {
            "stressed": ["stressed", "anxious", "worried", "overwhelmed", "pressure"],
            "avoidant": ["avoid", "procrastinate", "later", "tomorrow", "don't want", "lazy"],
            "sad": ["sad", "depressed", "down", "tired", "exhausted", "burnout"],
            "motivated": ["motivated", "excited", "ready", "pumped", "let's go", "hype"],
            "hyperfocused": ["flow", "focused", "in the zone", "crushing", "killing it"]
        }
        for state, keywords in states.items():
            for kw in keywords:
                if kw in msg_lower:
                    return state
        return "neutral"


# Singleton instance
llm_service = LLMService()
