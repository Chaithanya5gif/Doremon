import { useState, useEffect } from "react";
import { Play, Pause, Square, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as api from "@/services/api";
import { toast } from "sonner";

export default function SessionTimer() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTicking, setIsTicking] = useState(false);
  const [isSurrenderMode, setIsSurrenderMode] = useState(false);

  // Load session on mount
  useEffect(() => {
    loadActiveSession();

    const handleStartQuest = (e: any) => {
      const quest = e.detail;
      setActiveQuest(quest);
      // We check state at event time, no need to bind it in dependency array for this simple listener
      // though ideally we'd use a ref if we cared about latest state, but this is fine.
    };

    window.addEventListener("start-quest", handleStartQuest);
    return () => window.removeEventListener("start-quest", handleStartQuest);
  }, []);

  // Tick the timer
  useEffect(() => {
    let interval: any;
    if (isTicking && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTicking) {
      setIsTicking(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isTicking, timeRemaining]);

  const loadActiveSession = async () => {
    try {
      const response = await api.getActiveSession();
      if (response && response.active && response.session) {
        const session = response.session;
        setActiveSession(session);
        setIsTicking(session.status === 'active' || true); // Default to ticking if active
        
        // Retrieve planned_duration from localStorage since it's not in the DB schema
        const storedDuration = localStorage.getItem('doraemon_session_duration');
        const plannedMinutes = storedDuration ? parseInt(storedDuration) : 25; // default 25
        
        // Calculate remaining time based on start_time and duration
        const startTime = new Date(session.start_time).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, (plannedMinutes * 60) - elapsed);
        setTimeRemaining(remaining);
        
        // Use the quest returned with the session if available, else fetch
        if (session.quest) {
          setActiveQuest(session.quest);
        } else {
          const quest = await api.getQuest(session.quest_id);
          setActiveQuest(quest);
        }
      } else {
        setActiveSession(null);
        setIsTicking(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async (minutes: number) => {
    if (!activeQuest) {
      toast.error("Select a quest from the log first!");
      return;
    }

    try {
      const response = await api.startSession({
        quest_id: activeQuest.id
      });
      const session = response.session;
      
      // Save duration locally
      localStorage.setItem('doraemon_session_duration', minutes.toString());
      
      setActiveSession(session);
      setTimeRemaining(minutes * 60);
      setIsTicking(true);
      toast.success(`Session started: ${minutes} minutes. Don't you dare leave.`);
      window.dispatchEvent(new Event("quests-updated")); // Trigger UI updates
    } catch (err: any) {
      toast.error(err.message || "Failed to start session");
    }
  };

  const handleSessionComplete = async () => {
    try {
      if (activeSession) {
        await api.completeSession(activeSession.id);
        toast.success("Session Complete! XP Awarded.");
        setActiveSession(null);
        setActiveQuest(null);
        setIsTicking(false);
        localStorage.removeItem('doraemon_session_duration');
        window.dispatchEvent(new Event("quests-updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete session");
    }
  };

  const handleSurrender = async () => {
    try {
      if (activeSession) {
        await api.logEscapeAttempt({
          session_id: activeSession.id,
          reason: "Surrendered early",
          attempt_type: "quit_attempt"
        });
        // We pause it as part of surrender
        await api.pauseSession(activeSession.id);
        setIsTicking(false);
        setIsSurrenderMode(false);
        toast.error("Escape attempt logged. Doraemon is not pleased.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to log escape");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="system-panel p-6 flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-orbitron font-bold text-white tracking-widest uppercase flex items-center gap-2">
          <span className="text-system-cyan text-xs tracking-[0.2em] font-mono mr-2">[ SYSTEM TIMER ]</span>
          FOCUS
        </h2>
      </div>

      {!activeQuest ? (
        <div className="flex-1 border border-system-gray/20 bg-black/20 p-6 flex flex-col items-center justify-center text-center">
          <Play className="w-12 h-12 text-system-gray/30 mx-auto mb-4" />
          <div className="text-system-gray text-sm uppercase tracking-widest">[ STANDBY MODE ]</div>
          <div className="text-system-gray text-xs mt-2">Select a quest from the log to begin execution.</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          <div className="w-full text-center mb-6">
            <div className="text-system-cyan text-[10px] uppercase tracking-widest mb-2">ACTIVE TARGET</div>
            <div className="text-white text-lg font-bold">{activeQuest.title}</div>
          </div>

          <div className={`text-7xl font-orbitron font-bold tracking-widest mb-8 ${isTicking ? 'text-white' : 'text-system-gray'}`}>
            {timeRemaining > 0 ? formatTime(timeRemaining) : "00:00"}
          </div>

          {!activeSession ? (
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => handleStartSession(5)}
                className="flex-1 system-button py-4 border-system-cyan/50 text-system-cyan hover:bg-system-cyan/10 whitespace-nowrap"
              >
                [ 5 MIN START ]
              </button>
              <button 
                onClick={() => handleStartSession(25)}
                className="flex-1 system-button py-4 border-system-cyan/50 text-system-cyan hover:bg-system-cyan/10 whitespace-nowrap"
              >
                [ 25 MIN FOCUS ]
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {isSurrenderMode ? (
                <div className="p-4 border border-system-red bg-system-red/10 text-center animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-system-red mx-auto mb-2" />
                  <div className="text-system-red font-bold uppercase mb-2">ARE YOU SURE?</div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsSurrenderMode(false)} className="flex-1 py-2 border border-system-gray text-white whitespace-nowrap">RESUME</button>
                    <button onClick={handleSurrender} className="flex-1 py-2 bg-system-red text-white font-bold whitespace-nowrap">SURRENDER</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 w-full">
                  {isTicking ? (
                    <button 
                      onClick={() => setIsSurrenderMode(true)}
                      className="flex-1 system-button py-4 border-system-red/50 text-system-red hover:bg-system-red/10 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Pause className="w-5 h-5 shrink-0" /> [ EMERGENCY STOP ]
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsTicking(true)}
                      className="flex-1 system-button py-4 border-system-green/50 text-green-400 hover:bg-green-400/10 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Play className="w-5 h-5 shrink-0" /> [ RESUME ]
                    </button>
                  )}
                  <button 
                    onClick={handleSessionComplete}
                    className="flex-1 system-button py-4 border-system-cyan/50 text-system-cyan hover:bg-system-cyan/10 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" /> [ COMPLETE ]
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
