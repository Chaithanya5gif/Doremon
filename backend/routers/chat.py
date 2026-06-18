"""
DORAEMON Chat Router
Handles voice/text chat with Doraemon personality
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import database as db
from services.llm_service import llm_service

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(message: Dict[str, Any]):
    """Send a message to Doraemon and get response."""
    user_message = message.get("message", "")
    context_data = message.get("context", {})

    # Get current user and session info
    user = db.get_user()
    active_session = db.get_active_session()

    # Build context
    context = {
        'user': user,
        'active_quest': None,
        'mood': context_data.get('mood', 'neutral'),
        'escape_attempts': 0
    }

    if active_session:
        quest = db.get_quest(active_session['quest_id'])
        context['active_quest'] = quest
        context['escape_attempts'] = active_session.get('escape_attempts', 0)

    # Get LLM response
    result = llm_service.chat(user_message, context)

    return result


@router.post("/chat/voice")
async def voice_chat(message: Dict[str, Any]):
    """Voice chat endpoint - same as text but optimized for voice output."""
    result = await chat(message)

    # Ensure voice_text is set
    if not result.get('voice_text'):
        result['voice_text'] = result.get('response', '')

    return result


@router.get("/doraemon/status")
async def doraemon_status():
    """Get Doraemon's current mode and status."""
    user = db.get_user()
    active_session = db.get_active_session()

    mode_descriptions = {
        "cheerleader": "High energy, celebrates small wins",
        "drill_sergeant": "No mercy, blocks everything, forces 5-minute starts",
        "therapist": "Calm, validates feelings, reduces pressure",
        "best_friend": "Gentle, lowers expectations, focuses on 'just show up'",
        "silent_guardian": "Disappears, monitors, only interrupts for health breaks"
    }

    status = {
        "mode": user.get('personality_preference', 'cheerleader') if user else 'cheerleader',
        "mode_description": "",
        "has_active_session": active_session is not None,
        "is_blocking": False,
        "current_quest": None,
        "message": "Doraemon is standing by."
    }

    status['mode_description'] = mode_descriptions.get(status['mode'], 'Unknown mode')

    if active_session:
        quest = db.get_quest(active_session['quest_id'])
        status['current_quest'] = quest
        status['is_blocking'] = active_session.get('escape_attempts', 0) > 0
        status['message'] = f"Monitoring quest: {quest['title'] if quest else 'Unknown'}"

    return status


@router.post("/doraemon/mode")
async def set_doraemon_mode(data: Dict[str, Any]):
    """Set Doraemon's personality mode."""
    mode = data.get("mode", "cheerleader")
    valid_modes = ["cheerleader", "drill_sergeant", "therapist", "best_friend", "silent_guardian"]

    if mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Choose from: {', '.join(valid_modes)}")

    db.update_user({"personality_preference": mode})

    mode_messages = {
        "cheerleader": "Let's GO, Hunter! I'm fired up and ready to cheer you on!",
        "drill_sergeant": "No more excuses. Time to work. MOVE.",
        "therapist": "Hey... let's take a breath. I'm here. What's going on?",
        "best_friend": "I'm right here with you. Whatever you need, Hunter.",
        "silent_guardian": "I'll be watching from the shadows. Focus."
    }

    return {
        "mode": mode,
        "message": mode_messages.get(mode, "Mode updated."),
        "doraemon_response": mode_messages.get(mode, "Mode updated.")
    }
