import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Swords,
  CalendarDays,
  Crosshair,
  Skull,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400" },
  { path: "/quests", icon: Swords, label: "Quests", color: "text-yellow-400" },
  { path: "/planning", icon: CalendarDays, label: "Planning", color: "text-purple-400" },
  { path: "/focus", icon: Crosshair, label: "Focus", color: "text-green-400" },
  { path: "/boss-fight", icon: Skull, label: "Boss Fight", color: "text-red-400" },
  { path: "/chat", icon: MessageCircle, label: "Doraemon", color: "text-cyan-400" },
  { path: "/settings", icon: Settings, label: "Settings", color: "text-gray-400" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`bg-[#0d1221] border-r border-blue-900/30 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-blue-900/30">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DORAEMON
            </span>
          </Link>
        )}
        {collapsed && <Sparkles className="w-6 h-6 text-blue-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-blue-500/20 border border-blue-500/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? item.color : "text-gray-500 group-hover:text-gray-300"}`}
              />
              {!collapsed && (
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom badge */}
      {!collapsed && (
        <div className="p-4 border-t border-blue-900/30">
          <div className="glass rounded-lg p-3 text-center">
            <p className="text-xs text-blue-400 font-medium">SYSTEM ONLINE</p>
            <p className="text-[10px] text-gray-500 mt-1">v1.0.0 - Hunter Ready</p>
          </div>
        </div>
      )}
    </aside>
  );
}
