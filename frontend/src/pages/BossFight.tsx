import { useEffect, useState } from "react";
import {
  Skull,
  Trophy,
  Zap,
  TrendingUp,
  Swords,
  Shield,
  Target,
  Flame,
  ChevronRight,
  Star,
  Award,
  Sparkles,
} from "lucide-react";
import * as api from "@/services/api";
import { toast } from "sonner";

export default function BossFight() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await api.getWeeklyReport();
      setReport(data);
    } catch (err) {
      toast.error("Failed to load weekly report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Skull className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No Report Available</h2>
        <p className="text-gray-500">Complete some quests this week to generate your boss fight report.</p>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    S: "from-yellow-300 via-yellow-400 to-orange-500",
    A: "from-green-400 to-emerald-500",
    B: "from-blue-400 to-cyan-500",
    C: "from-gray-400 to-gray-500",
    D: "from-red-400 to-red-600",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Epic Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-red-500/30 mb-6">
          <Skull className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="text-red-400 font-bold tracking-wider">WEEK {report.week_number} BOSS BATTLE</span>
          <Skull className="w-5 h-5 text-red-400 animate-pulse" />
        </div>

        <h1
          className={`text-7xl font-black bg-gradient-to-r ${gradeColors[report.grade] || gradeColors.C} bg-clip-text text-transparent animate-level-up`}
        >
          GRADE {report.grade}
        </h1>

        <p className="text-gray-400 mt-4 max-w-lg mx-auto">{report.doraemon_message}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Swords} label="Quests" value={`${report.quests_completed}/${report.total_quests}`} color="text-blue-400" />
        <StatCard icon={Target} label="Completion" value={`${report.completion_rate}%`} color="text-green-400" />
        <StatCard icon={Flame} label="Focus Time" value={`${report.focus_time_hours}h`} color="text-orange-400" />
        <StatCard icon={Shield} label="Escapes Blocked" value={report.escape_attempts_blocked} color="text-red-400" />
      </div>

      {/* Stat Gains */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Stat Gains
        </h2>

        <div className="space-y-4">
          {[
            { key: "INT", label: "Intelligence", color: "bg-blue-500", desc: "Problem-solving & learning" },
            { key: "AGI", label: "Agility", color: "bg-green-500", desc: "Speed & adaptability" },
            { key: "STR", label: "Strength", color: "bg-red-500", desc: "Endurance & consistency" },
            { key: "FAME", label: "Fame", color: "bg-yellow-500", desc: "Output & recognition" },
          ].map((stat) => {
            const gain = report.stat_gains?.[stat.key] || 0;
            const barWidth = Math.min((gain / 200) * 100, 100);
            return (
              <div key={stat.key} className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <p className="text-sm font-bold text-white">{stat.key}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full flex items-center justify-end pr-2 transition-all duration-1000`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-[10px] text-white font-bold">+{gain}</span>
                    </div>
                  </div>
                </div>
                <div className="w-20">
                  <p className="text-xs text-gray-500">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast */}
      <div className="glass rounded-xl p-5 border-l-4 border-purple-500">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-purple-400 text-xs font-medium mb-1">NEXT WEEK FORECAST</p>
            <p className="text-gray-300 text-sm">{report.next_week_forecast}</p>
          </div>
        </div>
      </div>

      {/* Claim Rewards */}
      <div className="flex gap-4">
        <button
          onClick={() => toast.success("Rewards claimed! XP applied.")}
          className="flex-1 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 text-yellow-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-5 h-5" />
          Claim Rewards
        </button>
        <button
          onClick={loadReport}
          className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-5 h-5" />
          View Next Week
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
