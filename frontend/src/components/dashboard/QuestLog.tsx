import { useState, useEffect } from "react";
import { RefreshCw, Plus, Target, CheckCircle2 } from "lucide-react";
import * as api from "@/services/api";
import { toast } from "sonner";

export default function QuestLog() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [xp, setXp] = useState("25");
  const [category, setCategory] = useState("daily");

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const data = await api.getDailyBriefing();
      setQuests(data.today_quests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createQuest({
        title,
        description,
        xp_reward: parseInt(xp) || 25,
        time_slot: time,
        category: category,
      });
      toast.success("Quest added to the System.");
      setTitle("");
      setDescription("");
      setTime("");
      setIsFormOpen(false);
      loadQuests();
      // Dispatch a custom event to tell SystemStatus to refresh (optional simple sync)
      window.dispatchEvent(new Event("quests-updated"));
    } catch (err: any) {
      toast.error(err.message || "Failed to add quest");
    }
  };

  const handleCompleteQuest = async (id: number) => {
    try {
      await api.completeQuest(id);
      toast.success("Quest Completed! XP Awarded.");
      loadQuests();
      // Dispatch event to refresh stats globally
      window.dispatchEvent(new Event("quests-updated"));
    } catch (err: any) {
      toast.error(err.message || "Failed to complete quest");
    }
  };

  return (
    <div className="system-panel p-6 flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-orbitron font-bold text-white tracking-widest uppercase flex items-center gap-2">
          <span className="text-system-cyan text-xs tracking-[0.2em] font-mono mr-2">[ QUEST LOG ]</span>
          MISSIONS
        </h2>
        <div className="flex gap-2">
          <button onClick={loadQuests} className="system-button flex items-center gap-2 px-3 py-1.5 border-system-gray/30 text-system-gray hover:border-system-cyan hover:text-system-cyan">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-xs">RE-GEN</span>
          </button>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`system-button flex items-center gap-2 px-3 py-1.5 transition-colors ${
              isFormOpen 
                ? 'border-system-cyan/50 text-system-cyan bg-system-cyan/10' 
                : 'border-system-green/50 text-green-400 hover:border-green-400 hover:bg-green-400/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">{isFormOpen ? 'CANCEL' : 'ADD'}</span>
          </button>
        </div>
      </div>

      {/* Add Quest Form */}
      {isFormOpen && (
        <form onSubmit={handleAddQuest} className="space-y-3 p-4 border border-system-gray/20 bg-black/40">
          <div className="flex gap-3">
            <select 
              className="system-input bg-black cursor-pointer flex-1 text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="daily">DAILY QUEST</option>
              <option value="side">SIDE QUEST</option>
              <option value="story">STORY QUEST</option>
              <option value="habit">HABIT</option>
            </select>
            <input 
              type="number" 
              className="system-input w-24 text-center" 
              value={xp}
              onChange={(e) => setXp(e.target.value)}
            />
          </div>
          <input 
            type="text" 
            placeholder="Quest title" 
            className="system-input text-white" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Description (optional)" 
            className="system-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input 
            type="text" 
            placeholder='Time e.g. "09:00" (optional)' 
            className="system-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button type="submit" className="system-button w-full border-system-cyan/50 text-system-cyan mt-2 py-3 hover:bg-system-cyan/10 transition-colors">
            [ CREATE QUEST ]
          </button>
        </form>
      )}

      {/* Quests List */}
      <div className="flex-1 overflow-y-auto border border-system-cyan/20 bg-black/20 p-6 flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="w-6 h-6 border-2 border-system-cyan border-t-transparent rounded-full animate-spin" />
        ) : quests.filter(q => q.status !== "completed").length === 0 ? (
          <div className="space-y-4">
            <Target className="w-12 h-12 text-system-cyan/30 mx-auto" />
            <div className="text-system-cyan text-sm uppercase tracking-widest">[ NO QUESTS DETECTED ]</div>
            <div className="text-system-gray text-xs">Set a weekly goal and let Doraemon forge your path.</div>
          </div>
        ) : (
          <div className="w-full space-y-3 flex-1 flex flex-col justify-start text-left">
            {quests.filter(q => q.status !== "completed").map((quest) => (
              <div key={quest.id} className="p-4 border border-system-gray/30 hover:border-system-cyan/50 transition-colors bg-black/40 flex justify-between items-center group">
                <div>
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <div className="text-system-cyan text-[10px] uppercase tracking-widest">{quest.category}</div>
                    <div className="text-system-gray text-[10px]">{quest.xp_reward} XP</div>
                  </div>
                  <div className="text-white text-sm font-medium">{quest.title}</div>
                  {quest.description && <div className="text-system-gray text-xs mt-1">{quest.description}</div>}
                </div>
                <div className="hidden group-hover:flex items-center gap-2">
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("start-quest", { detail: quest }));
                    }}
                    className="flex items-center gap-2 px-3 py-2 border border-system-cyan/50 text-system-cyan bg-system-cyan/10 hover:bg-system-cyan/20 transition-all"
                  >
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">FOCUS</span>
                  </button>
                  <button 
                    onClick={() => handleCompleteQuest(quest.id)}
                    className="flex items-center gap-2 px-3 py-2 border border-system-green/50 text-green-400 bg-green-400/10 hover:bg-green-400/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">COMPLETE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
