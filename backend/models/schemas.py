"""
DORAEMON Pydantic Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserProfile(BaseModel):
    id: int
    name: str = "Hunter"
    level: int = 1
    xp: int = 0
    xp_to_next: int = 100
    stats: Dict[str, int] = Field(default_factory=lambda: {"INT": 10, "AGI": 10, "STR": 10, "FAME": 10, "LUK": 10})
    streak_days: int = 0
    longest_streak: int = 0
    personality_preference: str = "cheerleader"
    adhd_severity: int = 5
    hyperfocus_mode: bool = False
    total_quests_completed: int = 0
    total_focus_hours: float = 0
    escape_attempts_blocked: int = 0
    grade: str = "C"


class QuestCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "daily"  # story, daily, side, habit
    quest_type: str = "task"
    estimated_minutes: int = 60
    xp_reward: int = 10
    day_of_week: str = ""
    time_slot: str = ""
    verification_method: str = "self_report"
    subtasks: List[Dict[str, Any]] = Field(default_factory=list)


class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None  # pending, active, completed, failed
    estimated_minutes: Optional[int] = None
    xp_reward: Optional[int] = None
    day_of_week: Optional[str] = None
    time_slot: Optional[str] = None
    verification_method: Optional[str] = None
    subtasks: Optional[List[Dict[str, Any]]] = None
    completed_at: Optional[str] = None


class QuestResponse(QuestCreate):
    id: int
    status: str
    created_at: str
    completed_at: Optional[str] = None
    week_number: int
    year: int


class SessionCreate(BaseModel):
    quest_id: int
    user_mood: str = "motivated"
    doraemon_mode: str = "cheerleader"
    notes: str = ""


class SessionUpdate(BaseModel):
    end_time: Optional[str] = None
    interruptions: Optional[List[Dict[str, Any]]] = None
    escape_attempts: Optional[int] = None
    actual_focus_minutes: Optional[int] = None
    user_mood: Optional[str] = None
    doraemon_mode: Optional[str] = None
    verification_status: Optional[str] = None
    verification_data: Optional[Dict[str, Any]] = None
    xp_awarded: Optional[int] = None


class SessionResponse(BaseModel):
    id: int
    quest_id: int
    start_time: str
    end_time: Optional[str] = None
    interruptions: List[Dict[str, Any]] = []
    escape_attempts: int = 0
    actual_focus_minutes: int = 0
    user_mood: str
    doraemon_mode: str
    notes: str
    verification_status: str
    verification_data: Dict[str, Any] = {}
    xp_awarded: int = 0


class WeeklyPlanCreate(BaseModel):
    week_number: Optional[int] = None
    year: Optional[int] = None
    goals_text: str = ""
    timetable: Dict[str, Any] = Field(default_factory=dict)
    story_quests: List[Dict[str, Any]] = Field(default_factory=list)
    daily_quests: List[Dict[str, Any]] = Field(default_factory=list)
    side_quests: List[Dict[str, Any]] = Field(default_factory=list)
    habits: List[Dict[str, Any]] = Field(default_factory=list)


class WeeklyPlanResponse(BaseModel):
    id: int
    week_number: int
    year: int
    goals_text: str
    timetable: Dict[str, Any]
    story_quests: List[Dict[str, Any]]
    daily_quests: List[Dict[str, Any]]
    side_quests: List[Dict[str, Any]]
    habits: List[Dict[str, Any]]
    created_at: str
    is_active: bool


class EscapeAttempt(BaseModel):
    session_id: int
    attempt_type: str  # close_tab, switch_site, mark_complete, idle, quit_attempt
    target_site: Optional[str] = None
    user_reason: Optional[str] = None


class NegotiationRequest(BaseModel):
    session_id: int
    user_message: str
    context: Optional[Dict[str, Any]] = None


class NegotiationResponse(BaseModel):
    doraemon_message: str
    options: List[Dict[str, Any]]
    accepted: bool = False
    negotiated_minutes: Optional[int] = None


class MoodCheck(BaseModel):
    session_id: Optional[int] = None
    mood: str  # motivated, stressed, avoidant, sad, hyperfocused
    self_reported: bool = True
    notes: Optional[str] = None


class XPAward(BaseModel):
    session_id: int
    completion_percentage: int  # 0-100
    actual_minutes: int
    quest_difficulty: int = 1
    bonuses: List[str] = []  # streak_bonus, early_completion, no_escape


class BossFightResult(BaseModel):
    week_number: int
    grade: str
    stat_gains: Dict[str, int]
    quests_completed: int
    total_quests: int
    focus_time_hours: float
    escape_attempts_blocked: int
    doraemon_message: str


class GadgetResponse(BaseModel):
    id: int
    name: str
    description: str
    unlock_level: int
    is_unlocked: bool
    effect: str
    icon: str
    used_count: int


class DailyBriefing(BaseModel):
    user: UserProfile
    today_quests: List[QuestResponse]
    week_progress: Dict[str, Any]
    doraemon_message: str
    doraemon_mode: str
    tips: List[str]


class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    response: str
    voice_text: Optional[str] = None
    suggested_actions: List[str] = []
    emotional_state: str = "neutral"
