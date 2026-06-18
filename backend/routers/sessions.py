"""
DORAEMON Sessions Router
Handles work sessions, escape attempts, and negotiation
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import database as db
from models.schemas import SessionCreate, SessionUpdate, EscapeAttempt, NegotiationRequest, XPAward
from services.llm_service import llm_service

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/session/start")
async def start_session(session: SessionCreate):
    """Start a new work session."""
    # Check if there's already an active session
    active = db.get_active_session()
    if active:
        return {
            "message": "Already have an active session",
            "session": active,
            "warning": "Complete or pause current session first"
        }

    # Verify quest exists
    quest = db.get_quest(session.quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Update quest status to active
    db.update_quest(session.quest_id, {"status": "active"})

    # Create session
    session_data = session.model_dump()
    session_data['start_time'] = datetime.now().isoformat()
    created = db.create_session(session_data)

    return {
        "message": f"Session started for quest: {quest['title']}",
        "session": created,
        "doraemon_message": f"Quest accepted! {quest['title']} — Let's do this, Hunter! Focus mode activated."
    }


@router.get("/session/active")
async def get_active_session():
    """Get currently active session."""
    session = db.get_active_session()
    if not session:
        return {"active": False, "message": "No active session"}

    # Calculate elapsed time
    start = datetime.fromisoformat(session['start_time'])
    elapsed = datetime.now() - start
    session['elapsed_minutes'] = int(elapsed.total_seconds() / 60)

    # Get quest info
    quest = db.get_quest(session['quest_id'])
    session['quest'] = quest

    return {"active": True, "session": session}


@router.post("/session/{session_id}/checkpoint")
async def session_checkpoint(session_id: int, data: Optional[Dict[str, Any]] = None):
    """Mid-session checkpoint update."""
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = data or {}

    # Calculate focus time
    start = datetime.fromisoformat(session['start_time'])
    elapsed = datetime.now() - start
    update_data['actual_focus_minutes'] = int(elapsed.total_seconds() / 60)

    updated = db.update_session(session_id, update_data)

    # Determine Doraemon response based on elapsed time
    elapsed_min = update_data['actual_focus_minutes']
    if elapsed_min > 45:
        msg = "You've been at this for a while. 5-minute stretch break? I'll keep the timer running."
    elif elapsed_min > 25:
        msg = "25 minutes in! Solid focus. Keep going or take a quick break?"
    else:
        msg = "Making progress! Stay in the zone, Hunter."

    return {
        "session": updated,
        "doraemon_message": msg,
        "elapsed_minutes": elapsed_min
    }


@router.post("/session/{session_id}/complete")
async def complete_session(session_id: int, data: Optional[Dict[str, Any]] = None):
    """Complete a session with verification and XP award."""
    data = data or {}
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Calculate final focus time
    start = datetime.fromisoformat(session['start_time'])
    elapsed = datetime.now() - start
    focus_minutes = int(elapsed.total_seconds() / 60)

    # Get quest info
    quest = db.get_quest(session['quest_id'])

    # Calculate XP
    completion_pct = data.get('completion_percentage', 100)
    base_xp = quest.get('xp_reward', 10) if quest else 10
    xp = int(base_xp * (completion_pct / 100))

    # Bonuses
    bonuses = []
    if session.get('escape_attempts', 0) == 0:
        bonuses.append("no_escape")
        xp += 5
    if completion_pct >= 100:
        bonuses.append("full_completion")
        xp += 10
    if focus_minutes >= 45:
        bonuses.append("deep_focus")
        xp += 5

    # Update session
    update_data = {
        'end_time': datetime.now().isoformat(),
        'actual_focus_minutes': focus_minutes,
        'verification_status': data.get('verification_status', 'self_reported'),
        'verification_data': data.get('verification_data', {}),
        'xp_awarded': xp
    }
    updated = db.update_session(session_id, update_data)

    # Complete the quest if completion is high enough
    if completion_pct >= 80 and quest:
        db.update_quest(quest['id'], {"status": "completed", "completed_at": datetime.now().isoformat()})

    # Award XP
    xp_result = db.add_xp(xp)

    # Update total focus hours
    user = db.get_user()
    if user:
        new_total = user.get('total_focus_hours', 0) + (focus_minutes / 60)
        db.update_user({"total_focus_hours": round(new_total, 1)})

    # Generate completion message
    if completion_pct >= 100:
        msg = f"QUEST COMPLETE! +{xp} XP. That was solid, Hunter. Level {xp_result['new_level']} is getting close!"
    elif completion_pct >= 80:
        msg = f"Great work! {completion_pct}% complete. +{xp} XP. Almost there — tomorrow we finish it."
    else:
        msg = f"Session ended. {completion_pct}% complete. +{xp} XP. Every bit counts, Hunter."

    return {
        "session": updated,
        "xp_awarded": xp,
        "xp_result": xp_result,
        "focus_minutes": focus_minutes,
        "completion_percentage": completion_pct,
        "bonuses": bonuses,
        "doraemon_message": msg
    }


@router.post("/session/{session_id}/pause")
async def pause_session(session_id: int):
    """Pause a session (for breaks)."""
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "message": "Session paused. Break time!",
        "doraemon_message": "Taking a break? Smart. I'll be here when you're ready. 5 minutes, then back to it.",
        "session_id": session_id
    }


# ==================== ESCAPE & NEGOTIATION ====================

@router.post("/escape-attempt")
async def log_escape_attempt(attempt: EscapeAttempt):
    """Log and handle escape attempt."""
    session = db.get_session(attempt.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Log the escape attempt
    current_attempts = session.get('escape_attempts', 0) + 1
    db.update_session(attempt.session_id, {
        'escape_attempts': current_attempts
    })

    # Update user's total blocked count
    user = db.get_user()
    if user:
        db.update_user({
            'escape_attempts_blocked': user.get('escape_attempts_blocked', 0) + 1
        })

    # Generate blocking response based on attempt type
    responses = {
        'close_tab': {
            'message': 'Really? We were making progress.',
            'action': 'show_dialog',
            'blocking_screen': True
        },
        'switch_site': {
            'message': f'Nope. Not until the quest is done. {attempt.target_site or "That site"} will still exist later.',
            'action': 'full_screen_block',
            'blocking_screen': True
        },
        'mark_complete': {
            'message': 'Hold on. What exactly did you finish? Explain it to me.',
            'action': 'llm_interrogation',
            'blocking_screen': True
        },
        'idle': {
            'message': 'You still there? Blink twice if you need help.',
            'action': 'gentle_reminder',
            'blocking_screen': False
        },
        'quit_attempt': {
            'message': "Quitting? We need to talk about that. Let's negotiate.",
            'action': 'negotiation',
            'blocking_screen': True
        }
    }

    response = responses.get(attempt.attempt_type, responses['quit_attempt'])

    # Log the event
    db.log_session_event(attempt.session_id, 'escape_attempt', {
        'type': attempt.attempt_type,
        'target_site': attempt.target_site,
        'user_reason': attempt.user_reason,
        'attempt_number': current_attempts
    })

    return {
        "escape_blocked": True,
        "attempt_number": current_attempts,
        "doraemon_response": response['message'],
        "action_required": response['action'],
        "show_blocking_screen": response['blocking_screen'],
        "negotiation_triggered": attempt.attempt_type in ['quit_attempt', 'close_tab']
    }


@router.post("/negotiate")
async def negotiate(request: NegotiationRequest):
    """Handle negotiation when user tries to quit."""
    session = db.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get user context
    user = db.get_user()
    quest = db.get_quest(session['quest_id'])

    context = {
        'user': user,
        'active_quest': quest,
        'escape_attempts': session.get('escape_attempts', 0),
        'mood': session.get('user_mood', 'motivated')
    }

    # Get LLM negotiation response
    result = llm_service.negotiate(request.user_message, context)

    # Log the negotiation
    db.log_session_event(request.session_id, 'negotiation', {
        'user_message': request.user_message,
        'doraemon_response': result['doraemon_message'],
        'options_presented': [opt['id'] for opt in result['options']]
    })

    return result


@router.post("/negotiate/accept")
async def accept_negotiation(data: Dict[str, Any]):
    """User accepts negotiation offer."""
    option_id = data.get('option_id', 'micro_sprint')
    session_id = data.get('session_id')

    if option_id == 'micro_sprint':
        minutes = data.get('negotiated_minutes', 10)
        return {
            "accepted": True,
            "action": "micro_sprint",
            "minutes": minutes,
            "doraemon_message": f"Perfect! {minutes} minutes on the clock. Go!"
        }
    elif option_id == 'explain_tomorrow':
        # Evaluate the excuse
        excuse = data.get('user_explanation', '')
        evaluation = llm_service.evaluate_excuse(excuse)

        if evaluation.get('valid', False):
            return {
                "accepted": True,
                "action": "grace_period",
                "minutes": 30,
                "doraemon_message": f"Fine. But tomorrow we start 30 minutes earlier. Deal? {evaluation.get('suggested_action', '')}"
            }
        else:
            return {
                "accepted": False,
                "action": "back_to_work",
                "doraemon_message": f"That's not going to cut it. {evaluation.get('reason', 'Back to work!')}",
                "penalty_minutes": 5
            }

    return {"accepted": False, "message": "Unknown option"}


@router.post("/session/checkpoint")
async def session_checkpoint_deprecated(data: Optional[Dict[str, Any]] = None):
    """Generic session checkpoint (legacy endpoint)."""
    session = db.get_active_session()
    if not session:
        return {"active": False, "message": "No active session"}

    return await session_checkpoint(session['id'], data)
