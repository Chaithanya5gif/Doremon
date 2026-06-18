import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Swords,
  Plus,
  Search,
  Filter,
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  X,
  Play,
  Trophy,
  Flame,
  Target,
  BookOpen,
  Star,
} from "lucide-react";
import * as api from "@/services/api";
import { toast } from "sonner";

const categories = [
  { key: "all", label: "All Quests", icon: Swords },
  { key: "story", label: "Story", icon: Trophy },
  { key: "daily", label: "Daily", icon: Target },
  { key: "side", label: "Side", icon: Star },
  { key: "habit", label: "Habits", icon: Flame },
];

const statuses = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function Quests() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuests();
  }, [filterCategory, filterStatus]);

  const loadQuests = async () => {
    try {
      const filters: any = {};
      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterCategory !== "all") filters.category = filterCategory;
      const data = await api.getQuests(filters);
      setQuests(data);
    } catch (err) {
      toast.error("Failed to load quests");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (questId: number) => {
    try {
      await api.completeQuest(questId, { completion_percentage: 100 });
      toast.success("Quest completed! +XP");
      loadQuests();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete quest");
    }
  };

  const handleStart = async (questId: number) => {
    try {
      await api.startSession({
        quest_id: questId,
        user_mood: "motivated",
        doraemon_mode: "cheerleader",
      });
      toast.success("Focus mode activated!");
      navigate("/focus");
    } catch (err: any) {
      toast.error(err.message || "Failed to start session");
    }
  };

  const handleDelete = async (questId: number) => {
    if (!confirm("Delete this quest?")) return;
    try {
      await api.deleteQuest(questId);
      toast.success("Quest deleted");
      loadQuests();
    } catch (err) {
      toast.error("Failed to delete quest");
    }
  };

  const filteredQuests = quests.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-yellow-400" />
            Quest Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your quests and track progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Quest
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterCategory === cat.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s.key
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-gray-500 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Quests Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No quests found</p>
          <p className="text-gray-600 text-sm mt-2">
            {searchQuery ? "Try a different search" : "Create your first quest to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredQuests.map((quest) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              onComplete={() => handleComplete(quest.id)}
              onStart={() => handleStart(quest.id)}
              onDelete={() => handleDelete(quest.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateQuestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadQuests();
          }}
        />
      )}
    </div>
  );
}

function QuestRow({ quest, onComplete, onStart, onDelete }: {
  quest: any; onComplete: () => void; onStart: () => void; onDelete: () => void;
}) {
  const statusConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
    active: { color: "text-green-400", bg: "bg-green-500/10" },
    completed: { color: "text-blue-400", bg: "bg-blue-500/10" },
    failed: { color: "text-red-400", bg: "bg-red-500/10" },
  };

  const config = statusConfig[quest.status] || statusConfig.pending;
  const isDone = quest.status === "completed";

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-blue-500/30 transition-all">
      {/* Status Icon */}
      <button
        onClick={!isDone ? onComplete : undefined}
        className={`shrink-0 ${isDone ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
      >
        {isDone ? (
          <CheckCircle2 className="w-6 h-6 text-blue-400" />
        ) : (
          <Circle className={`w-6 h-6 ${config.color} hover:text-blue-400`} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium truncate ${isDone ? "line-through text-gray-500" : "text-white"}`}>
            {quest.title}
          </h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} capitalize shrink-0`}>
            {quest.category}
          </span>
        </div>
        {quest.description && <p className="text-sm text-gray-500 truncate">{quest.description}</p>}
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {quest.estimated_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            +{quest.xp_reward} XP
          </span>
          {quest.day_of_week && <span className="capitalize">{quest.day_of_week}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {quest.status === "pending" && (
          <button
            onClick={onStart}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            title="Start Focus"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          title="Delete"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CreateQuestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "daily",
    estimated_minutes: 60,
    xp_reward: 10,
    day_of_week: "",
    time_slot: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      await api.createQuest(form);
      toast.success("Quest created!");
      onCreated();
    } catch (err) {
      toast.error("Failed to create quest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            New Quest
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
              rows={2}
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="story">Story Quest</option>
                <option value="daily">Daily Quest</option>
                <option value="side">Side Quest</option>
                <option value="habit">Habit</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.estimated_minutes}
                onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                min={5}
                max={480}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Day</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Any</option>
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Time Slot</label>
              <select
                value={form.time_slot}
                onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Any</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
