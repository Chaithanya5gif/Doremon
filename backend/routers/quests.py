"""
DORAEMON Quests Router
Handles quest CRUD and management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import database as db
from models.schemas import QuestCreate, QuestUpdate

router = APIRouter(prefix="/api", tags=["quests"])


@router.get("/quests")
async def list_quests(
    status: Optional[str] = None,
    category: Optional[str] = None,
    day: Optional[str] = None
):
    """List quests with optional filters."""
    quests = db.get_quests(status=status, category=category, day=day)
    return quests


@router.post("/quests")
async def create_quest(quest: QuestCreate):
    """Create a new quest."""
    quest_data = quest.model_dump()
    created = db.create_quest(quest_data)
    return created


@router.get("/quests/{quest_id}")
async def get_quest(quest_id: int):
    """Get a specific quest."""
    quest = db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@router.patch("/quests/{quest_id}")
async def update_quest(quest_id: int, update: QuestUpdate):
    """Update a quest."""
    quest = db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    # Auto-set completed_at if status changed to completed
    if update_data.get('status') == 'completed' and not quest.get('completed_at'):
        from datetime import datetime
        update_data['completed_at'] = datetime.now().isoformat()

        # Award XP
        xp_reward = quest.get('xp_reward', 10)
        db.add_xp(xp_reward)

    updated = db.update_quest(quest_id, update_data)
    return updated


@router.delete("/quests/{quest_id}")
async def delete_quest(quest_id: int):
    """Delete a quest."""
    success = db.delete_quest(quest_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quest not found")
    return {"message": "Quest deleted", "id": quest_id}


@router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: int, data: Optional[Dict[str, Any]] = None):
    """Mark quest as complete with verification."""
    quest = db.get_quest(quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest['status'] == 'completed':
        return {"message": "Quest already completed", "quest": quest}

    from datetime import datetime
    update_data = {
        'status': 'completed',
        'completed_at': datetime.now().isoformat()
    }

    updated = db.update_quest(quest_id, update_data)

    # Award XP
    completion_pct = (data or {}).get('completion_percentage', 100)
    xp_reward = int(quest['xp_reward'] * (completion_pct / 100))
    xp_result = db.add_xp(xp_reward)

    return {
        "message": "Quest completed!",
        "quest": updated,
        "xp_awarded": xp_reward,
        "xp_result": xp_result
    }


@router.get("/daily-briefing")
async def daily_briefing():
    """Get morning daily briefing data."""
    import json
    from datetime import datetime
    from services.llm_service import llm_service

    user = db.get_user()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get today's day name
    today = datetime.now().strftime("%a")

    # Get quests for today
    today_quests = db.get_quests(day=today)
    pending_quests = db.get_quests(status="pending")

    # Get week progress
    week_stats = db.get_weekly_stats()

    # Determine Doraemon mode
    mode_map = {
        "cheerleader": "cheerleader",
        "drill": "drill_sergeant",
        "therapist": "therapist",
        "friend": "best_friend"
    }
    doraemon_mode = mode_map.get(user.get('personality_preference', 'cheerleader'), 'cheerleader')

    # Generate briefing message
    context = {
        'user': user,
        'today_quests': today_quests,
        'week_progress': week_stats
    }
    briefing_msg = llm_service.generate_daily_briefing(context)

    # Generate tips based on mode
    tips = []
    if doraemon_mode == "cheerleader":
        tips = ["Break tasks into 25-minute chunks", "Celebrate small wins", "You've got this!"]
    elif doraemon_mode == "drill_sergeant":
        tips = ["No excuses. Start now.", "5-minute rule: just start", "Discipline equals freedom"]
    elif doraemon_mode == "therapist":
        tips = ["It's okay to feel overwhelmed", "One step at a time", "Your effort matters more than perfection"]
    else:
        tips = ["I'm here with you", "Small progress is still progress", "Let's do this together"]

    return {
        "user": user,
        "today": datetime.now().strftime("%Y-%m-%d %A"),
        "today_quests": today_quests,
        "pending_quests": pending_quests,
        "week_progress": week_stats,
        "doraemon_message": briefing_msg,
        "doraemon_mode": doraemon_mode,
        "tips": tips,
        "active_session": db.get_active_session()
    }
