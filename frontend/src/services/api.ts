/**
 * DORAEMON API Service
 * Handles all backend communication
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// User & Stats
export const getStats = () => fetchAPI("/api/stats");
export const updateStats = (data: any) => fetchAPI("/api/stats", { method: "POST", body: JSON.stringify(data) });
export const addXP = (amount: number) => fetchAPI("/api/xp", { method: "POST", body: JSON.stringify({ amount }) });
export const moodCheck = (mood: string) => fetchAPI("/api/mood-check", { method: "POST", body: JSON.stringify({ mood }) });

// Quests
export const getQuests = (filters?: { status?: string; category?: string; day?: string }) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.day) params.append("day", filters.day);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchAPI(`/api/quests${query}`);
};
export const getQuest = (id: number) => fetchAPI(`/api/quests/${id}`);
export const createQuest = (data: any) => fetchAPI("/api/quests", { method: "POST", body: JSON.stringify(data) });
export const updateQuest = (id: number, data: any) => fetchAPI(`/api/quests/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteQuest = (id: number) => fetchAPI(`/api/quests/${id}`, { method: "DELETE" });
export const completeQuest = (id: number, data?: any) => fetchAPI(`/api/quests/${id}/complete`, { method: "POST", body: JSON.stringify(data || {}) });

// Planning
export const createWeeklyPlan = (data: any) => fetchAPI("/api/weekly-plan", { method: "POST", body: JSON.stringify(data) });
export const getWeeklyPlan = () => fetchAPI("/api/weekly-plan");
export const getWeeklyReport = () => fetchAPI("/api/weekly-report");

// Sessions
export const startSession = (data: any) => fetchAPI("/api/session/start", { method: "POST", body: JSON.stringify(data) });
export const getActiveSession = () => fetchAPI("/api/session/active");
export const completeSession = (id: number, data?: any) => fetchAPI(`/api/session/${id}/complete`, { method: "POST", body: JSON.stringify(data || {}) });
export const pauseSession = (id: number) => fetchAPI(`/api/session/${id}/pause`, { method: "POST" });
export const sessionCheckpoint = (id: number, data?: any) => fetchAPI(`/api/session/${id}/checkpoint`, { method: "POST", body: JSON.stringify(data || {}) });

// Escape & Negotiation
export const logEscapeAttempt = (data: any) => fetchAPI("/api/escape-attempt", { method: "POST", body: JSON.stringify(data) });
export const negotiate = (data: any) => fetchAPI("/api/negotiate", { method: "POST", body: JSON.stringify(data) });
export const acceptNegotiation = (data: any) => fetchAPI("/api/negotiate/accept", { method: "POST", body: JSON.stringify(data) });

// Chat
export const chat = (message: string, context?: any) => fetchAPI("/api/chat", { method: "POST", body: JSON.stringify({ message, context }) });
export const voiceChat = (message: string, context?: any) => fetchAPI("/api/chat/voice", { method: "POST", body: JSON.stringify({ message, context }) });
export const getDoraemonStatus = () => fetchAPI("/api/doraemon/status");
export const setDoraemonMode = (mode: string) => fetchAPI("/api/doraemon/mode", { method: "POST", body: JSON.stringify({ mode }) });

// Daily Briefing
export const getDailyBriefing = () => fetchAPI("/api/daily-briefing");

// Gadgets
export const getGadgets = () => fetchAPI("/api/gadgets");
export const getUnlockedGadgets = () => fetchAPI("/api/gadgets/unlocked");

export default {
  getStats, updateStats, addXP, moodCheck,
  getQuests, getQuest, createQuest, updateQuest, deleteQuest, completeQuest,
  createWeeklyPlan, getWeeklyPlan, getWeeklyReport,
  startSession, getActiveSession, completeSession, pauseSession, sessionCheckpoint,
  logEscapeAttempt, negotiate, acceptNegotiation,
  chat, voiceChat, getDoraemonStatus, setDoraemonMode,
  getDailyBriefing, getGadgets, getUnlockedGadgets
};
