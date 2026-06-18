import { useEffect, useState } from "react";
import { Zap, Flame, Trophy, Star } from "lucide-react";
import * as api from "@/services/api";

interface UserStats {
  level: number;
  xp: number;
  xp_to_next: number;
  streak_days: number;
  stats: Record<string, number>;
}

export default function StatusBar() {
  const [user, setUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setUser(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-14 bg-[#0d1221] border-b border-blue-900/30 flex items-center px-6 justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const xpPercent = (user.xp / user.xp_to_next) * 100;

  return (
    <div className="h-14 bg-[#0d1221] border-b border-blue-900/30 flex items-center px-6 justify-between">
      {/* Left: Level & XP */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-white">Lv.{user.level}</span>
        </div>

        {/* XP Bar */}
        <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full xp-bar-gradient rounded-full transition-all duration-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {user.xp}/{user.xp_to_next} XP
        </span>
      </div>

      {/* Center: Stats */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-gray-400">
            INT <span className="text-blue-400 font-medium">{user.stats?.INT || 10}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-gray-400">
            AGI <span className="text-green-400 font-medium">{user.stats?.AGI || 10}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-gray-400">
            STR <span className="text-red-400 font-medium">{user.stats?.STR || 10}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-gray-400">
            FAME <span className="text-yellow-400 font-medium">{user.stats?.FAME || 10}</span>
          </span>
        </div>
      </div>

      {/* Right: Streak */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-medium text-orange-400">{user.streak_days} days</span>
      </div>
    </div>
  );
}
