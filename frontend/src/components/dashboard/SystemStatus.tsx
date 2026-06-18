import { useEffect, useState } from "react";
import * as api from "@/services/api";

interface UserStats {
  name: string;
  level: number;
  xp: number;
  xp_to_next: number;
  streak_days: number;
  stats: Record<string, number>;
}

export default function SystemStatus() {
  const [user, setUser] = useState<UserStats | null>(null);

  const loadUser = () => {
    api.getStats().then(setUser).catch(console.error);
  };

  useEffect(() => {
    loadUser();
    
    // Listen for custom event from QuestLog
    window.addEventListener("quests-updated", loadUser);
    return () => window.removeEventListener("quests-updated", loadUser);
  }, []);

  if (!user) return <div className="system-panel p-6 animate-pulse bg-system-panel/50 h-full"></div>;

  const hp = 100;
  const mp = 50;

  return (
    <div className="system-panel p-6 flex flex-col h-full gap-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-system-cyan text-xs uppercase tracking-[0.2em] mb-2">[ SYSTEM STATUS ]</div>
          <h2 className="text-2xl font-orbitron font-bold text-white tracking-widest uppercase">
            {user.name || "HUNTER"}
          </h2>
          <div className="text-system-gray text-xs mt-1">Awakened Hunter</div>
        </div>
        <div className="text-right">
          <div className="text-system-cyan text-[10px] uppercase tracking-widest mb-1">LEVEL</div>
          <div className="text-4xl font-orbitron font-bold text-white leading-none">
            {user.level.toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* EXP Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-system-gray uppercase tracking-wider mb-1">
            <span>EXP</span>
            <span>{user.xp} / {user.xp_to_next}</span>
          </div>
          <div className="h-1.5 w-full bg-system-bg border border-system-gray/20">
            <div 
              className="h-full bg-system-red transition-all duration-1000" 
              style={{ width: `${(user.xp / user.xp_to_next) * 100}%` }}
            />
          </div>
        </div>

        {/* HP Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-system-gray uppercase tracking-wider mb-1">
            <span>HP</span>
            <span>{hp} / {hp}</span>
          </div>
          <div className="h-1.5 w-full bg-system-bg border border-system-gray/20">
            <div className="h-full bg-system-red w-full" />
          </div>
        </div>

        {/* MP Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-system-gray uppercase tracking-wider mb-1">
            <span>MP</span>
            <span>{mp} / {mp}</span>
          </div>
          <div className="h-1.5 w-full bg-system-bg border border-system-gray/20">
            <div className="h-full bg-system-cyan w-full" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-2 mt-auto pt-6 border-t border-system-gray/20">
        {[
          { label: "INT", value: user.stats?.INT || 10 },
          { label: "FOC", value: user.stats?.AGI || 10 }, // Mapped from AGI
          { label: "DIS", value: user.stats?.STR || 10 }, // Mapped from STR
          { label: "STA", value: user.stats?.FAME || 10 }, // Mapped from FAME
          { label: "WIL", value: user.stats?.LUK || 10 }, // Mapped from LUK
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-[10px] text-system-gray mb-1">{stat.label}</div>
            <div className="text-sm text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-widest text-system-gray">
        <div className="flex items-center gap-2">
          <span className="text-system-red">🔥</span>
          <span>{user.streak_days} day streak</span>
        </div>
        <button className="hover:text-system-red transition-colors">
          [ RESET SYSTEM ]
        </button>
      </div>
    </div>
  );
}
