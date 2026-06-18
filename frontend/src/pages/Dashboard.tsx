import { useState, useEffect } from "react";
import SystemStatus from "@/components/dashboard/SystemStatus";
import DoraemonMode from "@/components/dashboard/DoraemonMode";
import QuestLog from "@/components/dashboard/QuestLog";
import CommsTerminal from "@/components/dashboard/CommsTerminal";
import SessionTimer from "@/components/dashboard/SessionTimer";

export default function Dashboard() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        " at " +
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-system-bg p-4 md:p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      
      {/* Top Header */}
      <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-system-gray border-b border-system-gray/20 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-system-cyan">
            <span className="text-lg leading-none mt-[-2px]">■</span> 
            <span className="font-orbitron font-bold text-sm tracking-widest text-white">DORAEMON</span>
          </div>
          <span>v1.0 / System</span>
        </div>
        <div className="hidden sm:block">{time}</div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Status + Mode) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="h-[400px]">
            <SystemStatus />
          </div>
          <div className="h-[120px]">
            <DoraemonMode />
          </div>
        </div>

        {/* Middle Column (Quests) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="h-[544px]"> {/* Matches Status + Mode height + gap */}
            <QuestLog />
          </div>
        </div>

        {/* Right Column (Session Timer) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-[544px]">
            <SessionTimer />
          </div>
        </div>

        {/* Bottom Full Width (Comms) */}
        <div className="lg:col-span-12">
          <CommsTerminal />
        </div>

      </div>
    </div>
  );
}
