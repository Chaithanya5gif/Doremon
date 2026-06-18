import { useState, useEffect } from "react";
import { Heart, Star, Sword, Activity, EyeOff } from "lucide-react";
import * as api from "@/services/api";

export default function DoraemonMode() {
  const [activeMode, setActiveMode] = useState("best_friend");

  const modes = [
    { id: "best_friend", icon: Heart, label: "BEST" },
    { id: "cheerleader", icon: Star, label: "CHEERLEADER" },
    { id: "drill_sergeant", icon: Sword, label: "DRILL" },
    { id: "therapist", icon: Activity, label: "THERAPIST" },
    { id: "silent_guardian", icon: EyeOff, label: "SILENT" },
  ];

  useEffect(() => {
    api.getDoraemonStatus().then(data => {
      if (data && data.mode) {
        setActiveMode(data.mode);
      }
    }).catch(console.error);
  }, []);

  const handleModeSelect = async (modeId: string) => {
    try {
      setActiveMode(modeId); // Optimistic update
      await api.setDoraemonMode(modeId);
    } catch (err) {
      console.error(err);
      // Revert if failed
      api.getDoraemonStatus().then(data => setActiveMode(data.mode));
    }
  };

  return (
    <div className="system-panel p-6 h-full flex flex-col justify-center">
      <div className="text-system-cyan text-xs uppercase tracking-[0.2em] mb-4">[ DORAEMON MODE ]</div>
      <div className="grid grid-cols-5 gap-3">
        {modes.map(mode => {
          const isActive = mode.id === activeMode;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`flex flex-col items-center justify-center p-3 border transition-colors ${
                isActive 
                  ? "border-system-cyan text-system-cyan bg-system-cyan/10" 
                  : "border-system-gray/30 text-system-gray hover:border-system-gray hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <span className="text-[9px] uppercase tracking-wider">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
