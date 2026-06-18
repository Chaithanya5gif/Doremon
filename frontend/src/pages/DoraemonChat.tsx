import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  Shield,
  Zap,
  Heart,
  Brain,
} from "lucide-react";
import * as api from "@/services/api";
import { useVoice } from "@/hooks/useVoice";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "doraemon";
  content: string;
  timestamp: Date;
  emotional_state?: string;
}

export default function DoraemonChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "doraemon",
      content: "Hey Hunter! I'm Doraemon, your AI companion. I'm here to help you achieve your goals — OpenAI Residency, ACC CREATORS, ScamMotion — by any means necessary. What's on your mind?",
      timestamp: new Date(),
      emotional_state: "neutral",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [doraemonMode, setDoraemonMode] = useState("cheerleader");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voice = useVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Doraemon status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await api.getDoraemonStatus();
      if (status.mode) {
        setDoraemonMode(status.mode);
      }
    } catch (err) {
      // silent
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await api.chat(userMsg.content);

      const doraemonMsg: ChatMessage = {
        role: "doraemon",
        content: result.response,
        timestamp: new Date(),
        emotional_state: result.emotional_state,
      };

      setMessages((prev) => [...prev, doraemonMsg]);

      // Auto-speak Doraemon's response
      if (voice.speak && result.voice_text) {
        voice.speak(result.voice_text);
      }
    } catch (err) {
      toast.error("Failed to get response");
      const errorMsg: ChatMessage = {
        role: "doraemon",
        content: "Sorry Hunter, I'm having trouble connecting. But don't stop — keep going with your quest!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  // Submit voice transcript
  useEffect(() => {
    if (voice.transcript && !voice.isListening && !sending) {
      setInput(voice.transcript);
    }
  }, [voice.transcript, voice.isListening, sending]);

  const modeIcons: Record<string, any> = {
    cheerleader: Zap,
    drill_sergeant: Shield,
    therapist: Heart,
    best_friend: Sparkles,
    silent_guardian: Brain,
  };

  const ModeIcon = modeIcons[doraemonMode] || Zap;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="glass rounded-t-2xl p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              Doraemon
n              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 capitalize flex items-center gap-1">
                <ModeIcon className="w-3 h-3" />
                {doraemonMode.replace("_", " ")}
              </span>
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              System Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (voice.isSpeaking ? voice.stopSpeaking() : null)}
            className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
            title={voice.isSpeaking ? "Stop speaking" : "Voice output"}
          >
            {voice.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass border-x border-white/5 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "doraemon"
                  ? "bg-gradient-to-br from-blue-500 to-purple-500"
                  : "bg-white/10"
              }`}
            >
              {msg.role === "doraemon" ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-gray-300" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "doraemon"
                  ? "glass border-l-4 border-blue-500 rounded-tl-none"
                  : "bg-blue-500/20 border border-blue-500/20 rounded-tr-none"
              }`}
            >
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className="text-[10px] text-gray-600 mt-2">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass rounded-b-2xl p-4 border-t border-white/5">
        {/* Voice transcript preview */}
        {voice.isListening && voice.transcript && (
          <div className="mb-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <Mic className="w-3 h-3 animate-pulse" />
            {voice.transcript}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleVoiceInput}
            className={`p-3 rounded-xl transition-colors ${
              voice.isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            {voice.isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Talk to Doraemon..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />

          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/30 text-white rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick messages */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["I'm motivated!", "I'm stressed", "I want to quit", "I completed a quest!"].map((msg) => (
            <button
              key={msg}
              onClick={() => {
                setInput(msg);
              }}
              className="px-3 py-1.5 glass rounded-full text-xs text-gray-400 hover:text-white transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
