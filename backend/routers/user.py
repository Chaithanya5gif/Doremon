"""
DORAEMON User Router
Handles user profile, stats, and XP
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import database as db
from models.schemas import UserProfile

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/stats")
async def get_stats():
    """Get full hunter profile and stats."""
    user = db.get_user()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/stats")
async def update_stats(data: Dict[str, Any]):
    """Update user stats."""
    user = db.update_user(data)
    return user


@router.post("/xp")
async def add_xp(data: Dict[str, Any]):
    """Add XP to user."""
    amount = data.get("amount", 0)
    result = db.add_xp(amount)
    return result


@router.post("/mood-check")
async def mood_check(data: Dict[str, Any]):
    """Update emotional state and Doraemon mode."""
    mood = data.get("mood", "motivated")

    # Determine Doraemon mode based on mood
    mode_map = {
        "motivated": "cheerleader",
        "stressed": "therapist",
        "avoidant": "drill_sergeant",
        "sad": "best_friend",
        "hyperfocused": "silent_guardian"
    }

    doraemon_mode = mode_map.get(mood, "cheerleader")

    # Update user preferences
    db.update_user({
        "personality_preference": doraemon_mode
    })

    return {
        "mood": mood,
        "doraemon_mode": doraemon_mode,
        "message": f"Doraemon switched to {doraemon_mode} mode"
    }


@router.get("/gadgets")
async def get_gadgets():
    """Get all gadgets with unlock status."""
    user = db.get_user()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    gadgets = db.get_gadgets()
    for gadget in gadgets:
        gadget['is_unlocked'] = gadget['unlock_level'] <= user['level']

    return gadgets


@router.get("/gadgets/unlocked")
async def get_unlocked_gadgets():
    """Get unlocked gadgets."""
    return db.get_unlocked_gadgets()
