import { useState } from "react";
import {
  CalendarDays,
  Sparkles,
  Send,
  Trophy,
  Target,
  Star,
  Flame,
  ChevronRight,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react";
import * as api from "@/services/api";
import { toast } from "sonner";

export default function WeeklyPlanning() {
  const [goalsText, setGoalsText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!goalsText.trim()) {
      toast.error("Enter your weekly goals first!");
      return;
    }

    setGenerating(true);
    try {
      const result = await api.createWeeklyPlan({ goals_text: goalsText });
      setPlan(result.plan);
      toast.success(`Weekly plan created! ${result.total_quests_created} quests generated.`);
      setSaved(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleQuickGoal = (goal: string) => {
    setGoalsText((prev) => (prev ? prev + "\n" : "") + goal);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <CalendarDays className="w-6 h-6 text-purple-400" />
          Sunday Ritual
        </h1>
        <p className="text-gray-500">Plan your week. Conquer your goals.</p>
      </div>

      {/* Input Section */}
      {!saved && (
        <div className="glass-strong rounded-2xl p-6 animate-hud-glow">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">What are we conquering this week?</h2>
          </div>

          <textarea
            value={goalsText}
            onChange={(e) => setGoalsText(e.target.value)}
            placeholder="This week I need to finish ScamMotion drag-and-drop, solve 10 LeetCode mediums, write a blog post..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none min-h-[120px]"
          />

          {/* Quick Goals */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["LeetCode practice", "Ship a feature", "Write blog post", "Workout 4x", "Read a paper"].map(
              (goal) => (
                <button
                  key={goal}
                  onClick={() => handleQuickGoal(goal)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-full text-xs transition-colors"
                >
                  + {goal}
                </button>
              )
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Doraemon is planning...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Weekly Plan
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-6 animate-slide-in-right">
          {/* Story Quests */}
          {plan.story_quests?.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Story Quests
              </h3>
              <div className="space-y-3">
                {plan.story_quests.map((sq: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 glass rounded-lg p-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{sq.title}</p>
                      <p className="text-xs text-gray-500">{sq.description}</p>
                    </div>
                    <span className="text-xs text-yellow-400 font-medium">+{sq.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Quests */}
          {plan.daily_quests?.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                Daily Quests
              </h3>
              <div className="grid gap-2">
                {plan.daily_quests.map((dq: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 glass rounded-lg p-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs text-blue-400 font-bold">{dq.day?.slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{dq.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dq.estimated_minutes}m
                        </span>
                        <span>{dq.time_slot}</span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 font-medium shrink-0">+{dq.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timetable */}
          {plan.timetable && Object.keys(plan.timetable).length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                Weekly Timetable
              </h3>
              <div className="grid gap-2">
                {Object.entries(plan.timetable).map(([day, slots]: [string, any]) => (
                  <div key={day} className="glass rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-400 mb-2 capitalize">{day}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {slots.Morning && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-gray-500 mb-1">Morning</p>
                          <p className="text-gray-300">{slots.Morning}</p>
                        </div>
                      )}
                      {slots.Afternoon && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-gray-500 mb-1">Afternoon</p>
                          <p className="text-gray-300">{slots.Afternoon}</p>
                        </div>
                      )}
                      {slots.Evening && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-gray-500 mb-1">Evening</p>
                          <p className="text-gray-300">{slots.Evening}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habits */}
          {plan.habits?.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                Habits
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.habits.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 glass rounded-full px-4 py-2">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-sm text-gray-300">{h.title}</span>
                    <span className="text-xs text-gray-500">({h.frequency})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="glass rounded-xl p-6 text-center border border-green-500/30 bg-green-500/5">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Week Plan Locked In!</h3>
            <p className="text-sm text-gray-400 mb-4">
              Doraemon will see you Monday at 8 AM. Don't be late.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
            >
              Create Another Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
