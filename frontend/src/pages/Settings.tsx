import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Zap,
  Shield,
  Heart,
  Brain,
  Sparkles,
  Volume2,
  VolumeX,
  Save,
  AlertTriangle,
  DoorOpen,
  Clock,
  BookOpen,
  Lightbulb,
  Globe,
  Lock,
  CheckCircle2,
} from "lucide-react";
import * as api from "@/services/api";
import { useVoice } from "@/hooks/useVoice";
import { toast } from "sonner";

const doraemonModes = [
  {
    key: "cheerleader",
    label: "Cheerleader",
    description: "High energy, celebrates small wins",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  {
    key: "drill_sergeant",
    label: "Drill Sergeant",
    description: "No mercy, blocks everything, forces 5-minute starts",
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  {
    key: "therapist",
    label: "Therapist",
    description: "Calm, validates feelings, reduces pressure",
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/30",
  },
  {
    key: "best_friend",
    label: "Best Friend",
    description: "Gentle, lowers expectations, focuses on 'just show up'",
    icon: Sparkles,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  {
    key: "silent_guardian",
    label: "Silent Guardian",
    description: "Disappears, monitors, only interrupts for health breaks",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
];

const gadgets = [
  { name: "Anywhere Door", level: 5, icon: DoorOpen, desc: "Change work location when stuck" },
  { name: "Time Cloth", level: 10, icon: Clock, desc: "Reset a bad day, retry tomorrow" },
  { name: "Memory Bread", level: 15, icon: BookOpen, desc: "AI cheat sheets for complex topics" },
  { name: "Big Light", level: 20, icon: Lightbulb, desc: "3-month progress overview" },
  { name: "Translation Gummy", level: 25, icon: Globe, desc: "Auto-translate research papers" },
];

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState("cheerleader");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [adhdSeverity, setAdhdSeverity] = useState(5);
  const [hyperfocusMode, setHyperfocusMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const voice = useVoice();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await api.getStats();
      setUser(data);
      setSelectedMode(data.personality_preference || "cheerleader");
      setAdhdSeverity(data.adhd_severity || 5);
      setHyperfocusMode(data.hyperfocus_mode || false);
    } catch (err) {
      toast.error("Failed to load settings");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateStats({
        personality_preference: selectedMode,
        adhd_severity: adhdSeverity,
        hyperfocus_mode: hyperfocusMode,
      });
      await api.setDoraemonMode(selectedMode);
      toast.success("Settings saved! Doraemon has been updated.");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const testVoice = () => {
    if (voice.speak) {
      voice.speak("Hey Hunter! This is Doraemon's voice. Ready to conquer some quests?");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <SettingsIcon className="w-6 h-6 text-gray-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-500">Customize your Doraemon companion</p>
      </div>

      {/* Profile Card */}
      {user && (
        <div className="glass-strong rounded-2xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
            {user.name?.[0] || "H"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user.name || "Hunter"}</h2>
            <p className="text-sm text-gray-500">
              Level {user.level} | {user.streak_days} day streak | Grade {user.grade}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-purple-400">{user.xp} <span className="text-sm text-gray-500">/ {user.xp_to_next} XP</span></p>
          </div>
        </div>
      )}

      {/* Doraemon Mode */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Doraemon Personality Mode
        </h3>

        <div className="grid gap-3">
          {doraemonModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setSelectedMode(mode.key)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selectedMode === mode.key
                  ? `${mode.bg} ring-1 ring-blue-500/50`
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${mode.bg} flex items-center justify-center shrink-0`}>
                <mode.icon className={`w-5 h-5 ${mode.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{mode.label}</p>
                <p className="text-xs text-gray-500">{mode.description}</p>
              </div>
              {selectedMode === mode.key && (
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Settings */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-green-400" />
          Voice Settings
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white">Voice Output</p>
            <p className="text-xs text-gray-500">Doraemon speaks responses aloud</p>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              voiceEnabled ? "bg-blue-500" : "bg-gray-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                voiceEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <button
          onClick={testVoice}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          Test Voice
        </button>
      </div>

      {/* ADHD Settings */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          ADHD Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white">Severity Level</label>
              <span className="text-sm text-purple-400 font-medium">{adhdSeverity}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={adhdSeverity}
              onChange={(e) => setAdhdSeverity(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Mild</span>
              <span>Severe</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Hyperfocus Protection</p>
              <p className="text-xs text-gray-500">Reminders to take breaks during deep focus</p>
            </div>
            <button
              onClick={() => setHyperfocusMode(!hyperfocusMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                hyperfocusMode ? "bg-purple-500" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  hyperfocusMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gadget System */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-yellow-400" />
          Gadget Unlocks
        </h3>

        <div className="space-y-3">
          {gadgets.map((gadget) => {
            const isUnlocked = (user?.level || 1) >= gadget.level;
            return (
              <div
                key={gadget.name}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  isUnlocked ? "bg-white/5" : "bg-white/[0.02] opacity-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked ? "bg-yellow-500/20" : "bg-gray-800"
                  }`}
                >
                  <gadget.icon
                    className={`w-5 h-5 ${isUnlocked ? "text-yellow-400" : "text-gray-600"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isUnlocked ? "text-white" : "text-gray-600"}`}>
                    {gadget.name}
                  </p>
                  <p className="text-xs text-gray-500">{gadget.desc}</p>
                </div>
                <div className="text-right">
                  {isUnlocked ? (
                    <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">Lv.{gadget.level}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-xl p-6 border border-red-500/20">
        <h3 className="font-semibold flex items-center gap-2 mb-4 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Reset All Progress</p>
            <p className="text-xs text-gray-500">This will reset your level, XP, and all quests</p>
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure? This cannot be undone!")) {
                toast.error("Progress reset is disabled in demo mode");
              }
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
