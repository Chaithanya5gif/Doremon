"""
DORAEMON Database Layer
SQLite database with built-in sqlite3 module
"""
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "doraemon.db")


@contextmanager
def get_db():
    """Get database connection with row factory."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database with all tables."""
    with get_db() as conn:
        cursor = conn.cursor()

        # User profile table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT DEFAULT 'Hunter',
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                xp_to_next INTEGER DEFAULT 100,
                stats TEXT DEFAULT '{"INT": 10, "AGI": 10, "STR": 10, "FAME": 10, "LUK": 10}',
                streak_days INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                personality_preference TEXT DEFAULT 'cheerleader',
                adhd_severity INTEGER DEFAULT 5,
                hyperfocus_mode INTEGER DEFAULT 0,
                total_quests_completed INTEGER DEFAULT 0,
                total_focus_hours REAL DEFAULT 0,
                escape_attempts_blocked INTEGER DEFAULT 0,
                grade TEXT DEFAULT 'C',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Quests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'daily',
                quest_type TEXT DEFAULT 'task',
                estimated_minutes INTEGER DEFAULT 60,
                xp_reward INTEGER DEFAULT 10,
                status TEXT DEFAULT 'pending',
                day_of_week TEXT DEFAULT '',
                time_slot TEXT DEFAULT '',
                verification_method TEXT DEFAULT 'self_report',
                subtasks TEXT DEFAULT '[]',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                user_id INTEGER DEFAULT 1,
                week_number INTEGER DEFAULT 0,
                year INTEGER DEFAULT 0
            )
        """)

        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quest_id INTEGER,
                start_time TEXT DEFAULT CURRENT_TIMESTAMP,
                end_time TEXT,
                interruptions TEXT DEFAULT '[]',
                escape_attempts INTEGER DEFAULT 0,
                actual_focus_minutes INTEGER DEFAULT 0,
                user_mood TEXT DEFAULT 'motivated',
                doraemon_mode TEXT DEFAULT 'cheerleader',
                notes TEXT DEFAULT '',
                verification_status TEXT DEFAULT 'pending',
                verification_data TEXT DEFAULT '{}',
                xp_awarded INTEGER DEFAULT 0,
                FOREIGN KEY (quest_id) REFERENCES quests (id)
            )
        """)

        # Weekly plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weekly_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                goals_text TEXT DEFAULT '',
                timetable TEXT DEFAULT '{}',
                story_quests TEXT DEFAULT '[]',
                daily_quests TEXT DEFAULT '[]',
                side_quests TEXT DEFAULT '[]',
                habits TEXT DEFAULT '[]',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        """)

        # Session logs table (escape attempts, mood checks, etc.)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                log_type TEXT DEFAULT 'mood_check',
                data TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        """)

        # Gadgets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gadgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                unlock_level INTEGER DEFAULT 1,
                is_unlocked INTEGER DEFAULT 0,
                effect TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                used_count INTEGER DEFAULT 0
            )
        """)

        # Insert default gadgets if not exists
        cursor.execute("SELECT COUNT(*) FROM gadgets")
        if cursor.fetchone()[0] == 0:
            default_gadgets = [
                ("Anywhere Door", "Change work location suggestion when stuck", 5, 0, "location_change", "door"),
                ("Time Cloth", "Reset and retry tomorrow with no penalty", 10, 0, "reset_day", "clock"),
                ("Memory Bread", "AI-generated cheat sheets for complex topics", 15, 0, "cheat_sheet", "book"),
                ("Big Light", "Zoom out view - see 3-month progress in one screen", 20, 0, "progress_view", "light"),
                ("Translation Gummy", "Auto-translate research papers to simple language", 25, 0, "translate", "globe"),
            ]
            cursor.executemany(
                "INSERT INTO gadgets (name, description, unlock_level, is_unlocked, effect, icon) VALUES (?, ?, ?, ?, ?, ?)",
                default_gadgets
            )

        # Insert default user if not exists
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO users (name, level, xp, xp_to_next, stats, streak_days)
                VALUES ('Hunter', 1, 0, 100, '{"INT": 10, "AGI": 10, "STR": 10, "FAME": 10, "LUK": 10}', 0)
            """)

        conn.commit()
        print("[DORAEMON] Database initialized successfully")


def get_user() -> Optional[Dict[str, Any]]:
    """Get the user profile."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = 1")
        row = cursor.fetchone()
        if row:
            user = dict(row)
            user['stats'] = json.loads(user.get('stats', '{}'))
            return user
        return None


def update_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """Update user profile."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Build update fields
        allowed_fields = ['name', 'level', 'xp', 'xp_to_next', 'stats', 'streak_days',
                         'longest_streak', 'personality_preference', 'adhd_severity',
                         'hyperfocus_mode', 'total_quests_completed', 'total_focus_hours',
                         'escape_attempts_blocked', 'grade']

        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                if field == 'stats' and isinstance(data[field], dict):
                    updates.append(f"{field} = ?")
                    values.append(json.dumps(data[field]))
                else:
                    updates.append(f"{field} = ?")
                    values.append(data[field])

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(1)  # dummy for user_id
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            values[-1] = 1  # actual user_id
            cursor.execute(query, values)
            conn.commit()

        return get_user()


def create_quest(quest_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new quest."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quests (title, description, category, quest_type, estimated_minutes,
                              xp_reward, status, day_of_week, time_slot, verification_method,
                              subtasks, week_number, year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            quest_data.get('title', 'Untitled Quest'),
            quest_data.get('description', ''),
            quest_data.get('category', 'daily'),
            quest_data.get('quest_type', 'task'),
            quest_data.get('estimated_minutes', 60),
            quest_data.get('xp_reward', 10),
            quest_data.get('status', 'pending'),
            quest_data.get('day_of_week', ''),
            quest_data.get('time_slot', ''),
            quest_data.get('verification_method', 'self_report'),
            json.dumps(quest_data.get('subtasks', [])),
            quest_data.get('week_number', datetime.now().isocalendar()[1]),
            quest_data.get('year', datetime.now().year)
        ))
        quest_id = cursor.lastrowid

        cursor.execute("SELECT * FROM quests WHERE id = ?", (quest_id,))
        row = cursor.fetchone()
        quest = dict(row)
        quest['subtasks'] = json.loads(quest.get('subtasks', '[]'))
        return quest


def get_quests(status: Optional[str] = None, category: Optional[str] = None,
               day: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get quests with optional filters."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM quests WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)
        if category:
            query += " AND category = ?"
            params.append(category)
        if day:
            query += " AND day_of_week = ?"
            params.append(day)

        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        quests = []
        for row in rows:
            quest = dict(row)
            quest['subtasks'] = json.loads(quest.get('subtasks', '[]'))
            quests.append(quest)
        return quests


def get_quest(quest_id: int) -> Optional[Dict[str, Any]]:
    """Get a single quest by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM quests WHERE id = ?", (quest_id,))
        row = cursor.fetchone()
        if row:
            quest = dict(row)
            quest['subtasks'] = json.loads(quest.get('subtasks', '[]'))
            return quest
        return None


def update_quest(quest_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a quest."""
    with get_db() as conn:
        cursor = conn.cursor()

        allowed_fields = ['title', 'description', 'category', 'quest_type',
                         'estimated_minutes', 'xp_reward', 'status',
                         'day_of_week', 'time_slot', 'verification_method',
                         'subtasks', 'completed_at']

        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                if field == 'subtasks' and isinstance(data[field], list):
                    updates.append(f"{field} = ?")
                    values.append(json.dumps(data[field]))
                else:
                    updates.append(f"{field} = ?")
                    values.append(data[field])

        if updates:
            values.append(quest_id)
            query = f"UPDATE quests SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()

        return get_quest(quest_id)


def delete_quest(quest_id: int) -> bool:
    """Delete a quest."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM quests WHERE id = ?", (quest_id,))
        return cursor.rowcount > 0


def create_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new work session."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (quest_id, start_time, user_mood, doraemon_mode, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            session_data.get('quest_id'),
            session_data.get('start_time', datetime.now().isoformat()),
            session_data.get('user_mood', 'motivated'),
            session_data.get('doraemon_mode', 'cheerleader'),
            session_data.get('notes', '')
        ))
        session_id = cursor.lastrowid

        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        session = dict(row)
        session['interruptions'] = json.loads(session.get('interruptions', '[]'))
        session['verification_data'] = json.loads(session.get('verification_data', '{}'))
        return session


def get_session(session_id: int) -> Optional[Dict[str, Any]]:
    """Get a session by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            session = dict(row)
            session['interruptions'] = json.loads(session.get('interruptions', '[]'))
            session['verification_data'] = json.loads(session.get('verification_data', '{}'))
            return session
        return None


def update_session(session_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a session."""
    with get_db() as conn:
        cursor = conn.cursor()

        allowed_fields = ['end_time', 'interruptions', 'escape_attempts',
                         'actual_focus_minutes', 'user_mood', 'doraemon_mode',
                         'notes', 'verification_status', 'verification_data', 'xp_awarded']

        updates = []
        values = []
        for field in allowed_fields:
            if field in data:
                if field in ['interruptions', 'verification_data'] and isinstance(data[field], (list, dict)):
                    updates.append(f"{field} = ?")
                    values.append(json.dumps(data[field]))
                else:
                    updates.append(f"{field} = ?")
                    values.append(data[field])

        if updates:
            values.append(session_id)
            query = f"UPDATE sessions SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()

        return get_session(session_id)


def get_active_session() -> Optional[Dict[str, Any]]:
    """Get currently active session (no end_time)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            session = dict(row)
            session['interruptions'] = json.loads(session.get('interruptions', '[]'))
            session['verification_data'] = json.loads(session.get('verification_data', '{}'))
            return session
        return None


def create_weekly_plan(plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a weekly plan."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Deactivate old plans
        cursor.execute("UPDATE weekly_plans SET is_active = 0")

        now = datetime.now()
        week_number = plan_data.get('week_number', now.isocalendar()[1])
        year = plan_data.get('year', now.year)

        cursor.execute("""
            INSERT INTO weekly_plans (week_number, year, goals_text, timetable,
                                     story_quests, daily_quests, side_quests, habits, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            week_number, year,
            plan_data.get('goals_text', ''),
            json.dumps(plan_data.get('timetable', {})),
            json.dumps(plan_data.get('story_quests', [])),
            json.dumps(plan_data.get('daily_quests', [])),
            json.dumps(plan_data.get('side_quests', [])),
            json.dumps(plan_data.get('habits', []))
        ))
        plan_id = cursor.lastrowid

        cursor.execute("SELECT * FROM weekly_plans WHERE id = ?", (plan_id,))
        row = cursor.fetchone()
        plan = dict(row)
        plan['timetable'] = json.loads(plan.get('timetable', '{}'))
        plan['story_quests'] = json.loads(plan.get('story_quests', '[]'))
        plan['daily_quests'] = json.loads(plan.get('daily_quests', '[]'))
        plan['side_quests'] = json.loads(plan.get('side_quests', '[]'))
        plan['habits'] = json.loads(plan.get('habits', '[]'))
        return plan


def get_active_weekly_plan() -> Optional[Dict[str, Any]]:
    """Get the currently active weekly plan."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weekly_plans WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            plan = dict(row)
            plan['timetable'] = json.loads(plan.get('timetable', '{}'))
            plan['story_quests'] = json.loads(plan.get('story_quests', '[]'))
            plan['daily_quests'] = json.loads(plan.get('daily_quests', '[]'))
            plan['side_quests'] = json.loads(plan.get('side_quests', '[]'))
            plan['habits'] = json.loads(plan.get('habits', '[]'))
            return plan
        return None


def get_weekly_stats(week_number: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
    """Get stats for a specific week."""
    now = datetime.now()
    if week_number is None:
        week_number = now.isocalendar()[1]
    if year is None:
        year = now.year

    with get_db() as conn:
        cursor = conn.cursor()

        # Quest stats
        cursor.execute("""
            SELECT status, COUNT(*) as count FROM quests
            WHERE week_number = ? AND year = ?
            GROUP BY status
        """, (week_number, year))
        quest_status = {row['status']: row['count'] for row in cursor.fetchall()}

        # Total quests
        cursor.execute("""
            SELECT COUNT(*) as total FROM quests WHERE week_number = ? AND year = ?
        """, (week_number, year))
        total_quests = cursor.fetchone()['total']

        # Completed quests
        completed = quest_status.get('completed', 0)

        # Focus hours from sessions
        cursor.execute("""
            SELECT SUM(actual_focus_minutes) as total_minutes FROM sessions
            WHERE strftime('%W', start_time) = ? AND strftime('%Y', start_time) = ?
        """, (str(week_number), str(year)))
        result = cursor.fetchone()
        focus_hours = (result['total_minutes'] or 0) / 60.0

        # Escape attempts
        cursor.execute("SELECT SUM(escape_attempts) as total FROM sessions")
        result = cursor.fetchone()
        escape_attempts = result['total'] or 0

        # Calculate grade
        completion_rate = (completed / total_quests * 100) if total_quests > 0 else 0
        if completion_rate >= 90:
            grade = 'S'
        elif completion_rate >= 80:
            grade = 'A'
        elif completion_rate >= 70:
            grade = 'B'
        elif completion_rate >= 60:
            grade = 'C'
        else:
            grade = 'D'

        return {
            'week_number': week_number,
            'year': year,
            'total_quests': total_quests,
            'completed': completed,
            'failed': quest_status.get('failed', 0),
            'pending': quest_status.get('pending', 0),
            'active': quest_status.get('active', 0),
            'completion_rate': round(completion_rate, 1),
            'focus_hours': round(focus_hours, 1),
            'escape_attempts': escape_attempts,
            'grade': grade
        }


def get_gadgets() -> List[Dict[str, Any]]:
    """Get all gadgets."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gadgets ORDER BY unlock_level")
        return [dict(row) for row in cursor.fetchall()]


def get_unlocked_gadgets() -> List[Dict[str, Any]]:
    """Get unlocked gadgets for current user level."""
    user = get_user()
    if not user:
        return []

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM gadgets WHERE unlock_level <= ? ORDER BY unlock_level",
            (user['level'],)
        )
        gadgets = []
        for row in cursor.fetchall():
            gadget = dict(row)
            gadget['is_unlocked'] = True
            gadgets.append(gadget)
        return gadgets


def add_xp(amount: int) -> Dict[str, Any]:
    """Add XP to user and handle level-ups."""
    user = get_user()
    if not user:
        return {}

    new_xp = user['xp'] + amount
    new_level = user['level']
    xp_to_next = user['xp_to_next']
    leveled_up = False

    # Level up logic
    while new_xp >= xp_to_next:
        new_xp -= xp_to_next
        new_level += 1
        xp_to_next = int(xp_to_next * 1.5)  # Increasing difficulty
        leveled_up = True

    # Update stats on level up
    stats = user.get('stats', {})
    if leveled_up:
        stats['INT'] = stats.get('INT', 10) + 5
        stats['AGI'] = stats.get('AGI', 10) + 3
        stats['STR'] = stats.get('STR', 10) + 3
        stats['FAME'] = stats.get('FAME', 10) + 2

    update_user({
        'xp': new_xp,
        'level': new_level,
        'xp_to_next': xp_to_next,
        'stats': stats,
        'total_quests_completed': user.get('total_quests_completed', 0) + (1 if amount > 0 else 0)
    })

    return {
        'previous_xp': user['xp'],
        'new_xp': new_xp,
        'previous_level': user['level'],
        'new_level': new_level,
        'xp_to_next': xp_to_next,
        'leveled_up': leveled_up,
        'xp_gained': amount
    }


def log_session_event(session_id: int, log_type: str, data: Dict[str, Any]):
    """Log a session event."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO session_logs (session_id, log_type, data)
            VALUES (?, ?, ?)
        """, (session_id, log_type, json.dumps(data)))
        conn.commit()
