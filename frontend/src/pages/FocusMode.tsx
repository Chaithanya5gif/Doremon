import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Clock,
  Pause,
  Play,
  Square,
  Shield,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Zap,
  CheckCircle2,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as api from "@/services/api";
import { useVoice } from "@/hooks/useVoice";
import { toast } from "sonner";

export default function FocusMode() {
  const [session, setSession] = useState<any>(null);
  const [quest, setQuest] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBlocking, setShowBlocking] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [negotiationMsg, setNegotiationMsg] = useState("");
  const [completionPercent, setCompletionPercent] = useState(100);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const voice = useVoice();

  // Load active session
  useEffect(() => {
    loadSession();
  }, []);

  // Timer
  useEffect(() => {
    if (session && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, isPaused]);

  const loadSession = async () => {
    try {
      const data = await api.getActiveSession();
      if (data.active) {
        setSession(data.session);
        setQuest(data.session.quest);
        const start = new Date(data.session.start_time);
        const now = new Date();
        setElapsedSeconds(Math.floor((now.getTime() - start.getTime()) / 1000));
      } else {
        // No active session
        setSession(null);
      }
    } catch (err) {
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast.info("Session paused. Take a breather!");
    } else {
      toast.success("Back at it!");
    }
  };

  const handleComplete = async () => {
    if (!session) return;
    try {
      const result = await api.completeSession(session.id, {
        completion_percentage: completionPercent,
        verification_status: "self_reported",
        verification_data: { notes: sessionNotes },
      });

      if (voice.speak) {
        voice.speak(result.doraemon_message);
      }

      toast.success(result.doraemon_message);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete session");
    }
  };

  const handleEscapeAttempt = async (type: string) => {
    if (!session) return;
    try {
      const result = await api.logEscapeAttempt({
        session_id: session.id,
        attempt_type: type,
      });

      if (result.show_blocking_screen) {
        setShowBlocking(true);
        if (voice.speak) {
          voice.speak(result.doraemon_response);
        }
      }

      if (result.negotiation_triggered) {
        setNegotiationMsg(result.doraemon_response);
        setShowNegotiation(true);
      }

      toast.info(result.doraemon_response);
    } catch (err) {
      console.error("Escape attempt failed:", err);
    }
  };

  const handleNegotiation = async (userMessage: string) => {
    if (!session) return;
    try {
      const result = await api.negotiate({
        session_id: session.id,
        user_message: userMessage,
      });

      setNegotiationMsg(result.doraemon_message);

      if (voice.speak) {
        voice.speak(result.doraemon_message);
      }

      toast.info(result.doraemon_message);
    } catch (err) {
      toast.error("Negotiation failed");
    }
  };

  const handleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  // Submit voice transcript as chat
  useEffect(() => {
    if (voice.transcript && !voice.isListening) {
      // Voice input complete
      toast.info(`You said: "${voice.transcript}"`);
    }
  }, [voice.transcript, voice.isListening]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No Active Session</h2>
        <p className="text-gray-500 mb-6">Start a quest from the dashboard to enter focus mode.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const progressPercent = quest ? Math.min((elapsedSeconds / (quest.estimated_minutes * 60)) * 100, 100) : 0;

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleEscapeAttempt("switch_site")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Exit Focus (attempt blocked)</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => voice.speak ? voice.stopSpeaking() : null}
            className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            {voice.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Card */}
      <div className="glass-strong rounded-2xl p-8 animate-hud-glow">
        {/* Quest Info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium mb-4">
            <Shield className="w-3 h-3" />
            FOCUS MODE ACTIVE
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{quest?.title || "Focus Session"}</h1>
          {quest?.description && <p className="text-gray-400">{quest.description}</p>}
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-7xl font-mono font-bold text-white tracking-wider">
            {formatTime(elapsedSeconds)}
          </div>
          <p className="text-gray-500 mt-2">
            of {quest?.estimated_minutes || "?"} minutes estimated
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={handlePause}
            className={`p-4 rounded-xl transition-colors ${
              isPaused
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
            }`}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>

          <button
            onClick={handleVoiceInput}
            className={`p-4 rounded-xl transition-colors ${
              voice.isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            }`}
          >
            {voice.isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setShowBlocking(true)}
            className="p-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors"
          >
            <Square className="w-6 h-6" />
          </button>
        </div>

        {/* Voice Transcript */}
        {voice.transcript && (
          <div className="glass rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-gray-300">"{voice.transcript}"</p>
          </div>
        )}

        {/* XP Preview */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>+{quest?.xp_reward || 0} XP on completion</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <button
          onClick={() => handleEscapeAttempt("idle")}
          className="glass rounded-xl p-4 text-center hover:border-yellow-500/30 transition-colors"
        >
          <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Take Break</p>
        </button>
        <button
          onClick={() => setShowNegotiation(true)}
          className="glass rounded-xl p-4 text-center hover:border-blue-500/30 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Talk to Doraemon</p>
        </button>
        <button
          onClick={() => handleEscapeAttempt("quit_attempt")}
          className="glass rounded-xl p-4 text-center hover:border-red-500/30 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">I Want to Quit</p>
        </button>
      </div>

      {/* Blocking Screen Overlay */}
      {showBlocking && (
        <BlockingScreen
          quest={quest}
          elapsedSeconds={elapsedSeconds}
          onResume={() => setShowBlocking(false)}
          onNegotiate={() => {
            setShowBlocking(false);
            setShowNegotiation(true);
          }}
          doraemonMessage={negotiationMsg || "YouTube will still exist in 2 hours. This bug won't fix itself."}
        />
      )}

      {/* Negotiation Dialog */}
      {showNegotiation && (
        <NegotiationDialog
          message={negotiationMsg}
          onNegotiate={handleNegotiation}
          onAcceptMicroSprint={() => {
            setShowNegotiation(false);
            setIsPaused(false);
            toast.success("10-minute sprint! Go!");
          }}
          onComplete={() => {
            setShowNegotiation(false);
            handleComplete();
          }}
          sessionNotes={sessionNotes}
          setSessionNotes={setSessionNotes}
          completionPercent={completionPercent}
          setCompletionPercent={setCompletionPercent}
        />
      )}
    </div>
  );
}

// Blocking Screen Component
function BlockingScreen({
  quest,
  elapsedSeconds,
  onResume,
  onNegotiate,
  doraemonMessage,
}: {
  quest: any;
  elapsedSeconds: number;
  onResume: () => void;
  onNegotiate: () => void;
  doraemonMessage: string;
}) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const remainingMinutes = Math.max((quest?.estimated_minutes || 60) - Math.floor(elapsedSeconds / 60), 0);

  return (
    <div className="fixed inset-0 z-[100] animate-blocking flex items-center justify-center">
      <div className="glass-strong rounded-2xl p-8 max-w-lg w-full mx-4 border border-red-500/30">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm font-bold mb-4">
            <Shield className="w-4 h-4" />
            DORAEMON HAS ACTIVATED FOCUS MODE
          </div>
          <h2 className="text-xl font-bold text-white">Stay Focused, Hunter</h2>
        </div>

        {/* Session Info */}
        <div className="glass rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current Quest</span>
            <span className="text-white font-medium">{quest?.title || "Unknown"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time Elapsed</span>
            <span className="text-blue-400 font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Est. Remaining</span>
            <span className="text-yellow-400 font-mono">{remainingMinutes} minutes</span>
          </div>
        </div>

        {/* Doraemon Message */}
        <div className="glass rounded-xl p-4 border-l-4 border-blue-500 mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">{doraemonMessage}</p>
        </div>

        {/* Tip */}
        <div className="bg-blue-500/10 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-400">
            TIP: Break it smaller. Just read the error message. That's all. One line.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Resume Work
          </button>
          <button
            onClick={onNegotiate}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            I Have an Emergency
          </button>
        </div>
      </div>
    </div>
  );
}

// Negotiation Dialog Component
function NegotiationDialog({
  message,
  onNegotiate,
  onAcceptMicroSprint,
  onComplete,
  sessionNotes,
  setSessionNotes,
  completionPercent,
  setCompletionPercent,
}: {
  message: string;
  onNegotiate: (msg: string) => void;
  onAcceptMicroSprint: () => void;
  onComplete: () => void;
  sessionNotes: string;
  setSessionNotes: (s: string) => void;
  completionPercent: number;
  setCompletionPercent: (n: number) => void;
}) {
  const [userInput, setUserInput] = useState("");
  const [step, setStep] = useState<"negotiate" | "complete">("negotiate");

  const handleSend = () => {
    if (!userInput.trim()) return;
    onNegotiate(userInput);
    setUserInput("");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="glass-strong rounded-2xl p-6 max-w-md w-full mx-4 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Doraemon
          </h3>
          <button onClick={onAcceptMicroSprint} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === "negotiate" ? (
          <>
            {/* Doraemon Message */}
            <div className="glass rounded-xl p-4 mb-4 border-l-4 border-blue-500">
              <p className="text-gray-300 text-sm">
                {message || "Okay, I hear you. Let's negotiate. You have two options:\n\n1. Do 10 more minutes — just 10 — then you can stop.\n\n2. Tell me exactly why tomorrow will be different.\n\nBut 'I'm tired' isn't a reason. You're always tired. What's the real thing?"}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              <button
                onClick={onAcceptMicroSprint}
                className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-colors text-left px-4"
              >
                <span className="font-bold">Option 1:</span> Do a 10-minute micro-sprint
              </button>
              <button
                onClick={() => setStep("complete")}
                className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition-colors text-left px-4"
              >
                <span className="font-bold">Option 2:</span> End session & report progress
              </button>
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Talk to Doraemon..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Complete Session */}
            <p className="text-gray-300 text-sm mb-4">How much did you complete?</p>

            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={100}
                value={completionPercent}
                onChange={(e) => setCompletionPercent(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="text-blue-400 font-medium">{completionPercent}%</span>
                <span>100%</span>
              </div>
            </div>

            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you accomplish? (optional)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none mb-4"
              rows={2}
            />

            <button
              onClick={onComplete}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete Session (+{Math.floor((completionPercent / 100) * 20)} XP)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
