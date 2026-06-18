"""
DORAEMON Planning Router
Handles weekly quest planning (Sunday Ritual)
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import database as db
from models.schemas import WeeklyPlanCreate
from services.llm_service import llm_service

router = APIRouter(prefix="/api", tags=["planning"])


@router.post("/weekly-plan")
async def create_weekly_plan(plan: WeeklyPlanCreate):
    """Create weekly plan from goals using LLM breakdown."""
    # Generate plan using LLM if goals_text provided
    if plan.goals_text:
        context = {"user": db.get_user()}
        generated = llm_service.generate_weekly_plan(plan.goals_text, context)

        # Compute defaults for week/year
        from datetime import datetime as _dt
        _now = _dt.now()
        _week = plan.week_number if plan.week_number is not None else _now.isocalendar()[1]
        _year = plan.year if plan.year is not None else _now.year

        # Merge with provided data
        plan_data = {
            "week_number": _week,
            "year": _year,
            "goals_text": plan.goals_text,
            "timetable": plan.timetable or generated.get("timetable", {}),
            "story_quests": plan.story_quests or generated.get("story_quests", []),
            "daily_quests": plan.daily_quests or generated.get("daily_quests", []),
            "side_quests": plan.side_quests or generated.get("side_quests", []),
            "habits": plan.habits or generated.get("habits", [])
        }
    else:
        from datetime import datetime as _dt
        _now = _dt.now()
        plan_data = plan.model_dump()
        # Fill in None week_number / year with sensible defaults
        if plan_data.get("week_number") is None:
            plan_data["week_number"] = _now.isocalendar()[1]
        if plan_data.get("year") is None:
            plan_data["year"] = _now.year

    # Save plan
    saved_plan = db.create_weekly_plan(plan_data)

    # Create quests from the plan
    from datetime import datetime
    week_num = saved_plan['week_number']
    year = saved_plan['year']

    # Create story quests
    for sq in saved_plan.get('story_quests', []):
        db.create_quest({
            "title": sq.get('title', 'Story Quest'),
            "description": sq.get('description', ''),
            "category": "story",
            "quest_type": "milestone",
            "xp_reward": sq.get('xp_reward', 50),
            "week_number": week_num,
            "year": year
        })

    # Create daily quests
    for dq in saved_plan.get('daily_quests', []):
        db.create_quest({
            "title": dq.get('title', 'Daily Quest'),
            "category": "daily",
            "quest_type": "task",
            "estimated_minutes": dq.get('estimated_minutes', 60),
            "xp_reward": dq.get('xp_reward', 20),
            "day_of_week": dq.get('day', ''),
            "time_slot": dq.get('time_slot', ''),
            "week_number": week_num,
            "year": year
        })

    # Create side quests
    for sq in saved_plan.get('side_quests', []):
        db.create_quest({
            "title": sq.get('title', 'Side Quest'),
            "description": sq.get('description', ''),
            "category": "side",
            "quest_type": "optional",
            "xp_reward": sq.get('xp_reward', 15),
            "week_number": week_num,
            "year": year
        })

    # Create habits
    for h in saved_plan.get('habits', []):
        db.create_quest({
            "title": h.get('title', 'Habit'),
            "category": "habit",
            "quest_type": "recurring",
            "xp_reward": h.get('xp_reward', 5),
            "description": f"Frequency: {h.get('frequency', 'daily')}",
            "week_number": week_num,
            "year": year
        })

    return {
        "plan": saved_plan,
        "message": "Weekly plan created! Quests generated.",
        "total_quests_created": len(saved_plan.get('story_quests', [])) +
                               len(saved_plan.get('daily_quests', [])) +
                               len(saved_plan.get('side_quests', [])) +
                               len(saved_plan.get('habits', []))
    }


@router.get("/weekly-plan")
async def get_active_weekly_plan():
    """Get currently active weekly plan."""
    plan = db.get_active_weekly_plan()
    if not plan:
        return {"message": "No active weekly plan. Create one on Sunday!", "plan": None}
    return plan


@router.get("/weekly-report")
async def get_weekly_report():
    """Get weekly boss fight report."""
    from datetime import datetime
    from services.llm_service import llm_service

    stats = db.get_weekly_stats()
    user = db.get_user()

    # Calculate stat gains based on performance
    completion_rate = stats['completion_rate']
    stat_gains = {
        "INT": int(completion_rate * 1.2),
        "AGI": int(completion_rate * 0.8),
        "STR": int(stats['focus_hours'] * 2),
        "FAME": int(stats['completed'] * 2)
    }

    # Update user stats
    current_stats = user.get('stats', {})
    for stat, gain in stat_gains.items():
        current_stats[stat] = current_stats.get(stat, 10) + gain

    db.update_user({"stats": current_stats, "grade": stats['grade']})

    # Generate Doraemon message
    if stats['grade'] == 'S':
        msg = "PERFECT WEEK, Hunter! S-Rank! The System is impressed. Your stats are soaring!"
    elif stats['grade'] == 'A':
        msg = "Outstanding work, Hunter! A-Rank! The OpenAI Residency is within reach."
    elif stats['grade'] == 'B':
        msg = "Solid week, Hunter. B-Rank. Room for improvement, but you're on the path."
    elif stats['grade'] == 'C':
        msg = "C-Rank this week. I'm not mad, just... concerned. Let's do better next week."
    else:
        msg = "D-Rank. Hunter... talk to me. What's really going on? We need to fix this."

    return {
        "week_number": stats['week_number'],
        "grade": stats['grade'],
        "stat_gains": stat_gains,
        "quests_completed": stats['completed'],
        "total_quests": stats['total_quests'],
        "focus_time_hours": stats['focus_hours'],
        "escape_attempts_blocked": user.get('escape_attempts_blocked', 0),
        "completion_rate": stats['completion_rate'],
        "doraemon_message": msg,
        "next_week_forecast": "Based on your patterns, I suggest starting with easier quests in the morning."
    }
