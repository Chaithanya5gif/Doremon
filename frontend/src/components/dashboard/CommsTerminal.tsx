import { useState, useRef, useEffect } from "react";
import { useVoice } from "@/hooks/useVoice";
import { Mic, MicOff } from "lucide-react";
import * as api from "@/services/api";

export default function CommsTerminal() {
  const [messages, setMessages] = useState([
    { sender: "DORAEMON", text: "System online. Voice module active. Awaiting your command, Hunter.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const voice = useVoice();
  const [voiceMode, setVoiceMode] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Voice Transcript
  useEffect(() => {
    if (voiceMode && voice.transcript && !voice.isListening) {
      // User stopped speaking, send the transcript
      handleSendText(voice.transcript);
    }
  }, [voice.isListening, voice.transcript, voiceMode]);

  const toggleVoiceMode = () => {
    if (voiceMode) {
      voice.stopListening();
      voice.stopSpeaking();
      setVoiceMode(false);
    } else {
      voice.startListening();
      setVoiceMode(true);
    }
  };

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;

    // Add Hunter message
    setMessages(prev => [...prev, { 
      sender: "HUNTER", 
      text: text, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setInput("");

    try {
      // Send to backend
      const response = await api.chat(text, { mood: "best_friend" });
      
      // Add Doraemon message
      setMessages(prev => [...prev, { 
        sender: "DORAEMON", 
        text: response.response, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);

      // Speak response if voice mode is on
      if (voiceMode) {
        voice.speak(response.voice_text || response.response);
        // Start listening again after speaking is done
        setTimeout(() => {
           if (voiceMode) voice.startListening();
        }, 1000); // Give it a sec before checking (useVoice handles speaking state internally but we need to wait for it to finish)
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: "SYSTEM ERROR", 
        text: "Failed to reach AI Core.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendText(input);
  };

  return (
    <div className="system-panel flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-6 py-3 border-b border-system-gray/20 flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-system-cyan animate-pulse" />
          <div className="text-system-cyan text-[10px] uppercase tracking-widest">
            DORAEMON COMMS <span className="text-system-gray ml-2">MODE: BEST FRIEND</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleVoiceMode}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${
              voiceMode ? 'text-system-red' : 'text-system-gray hover:text-white'
            }`}
          >
            {voiceMode ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            VOICE {voiceMode ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={() => setMessages([])}
            className="text-system-gray text-[10px] uppercase tracking-widest hover:text-white transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20">
        {messages.map((msg, idx) => {
          const isDoraemon = msg.sender === "DORAEMON";
          return (
            <div key={idx} className={`flex flex-col ${isDoraemon ? 'items-start' : 'items-end'}`}>
              <div className={`px-2 py-1 mb-1 border text-[10px] uppercase tracking-wider ${
                isDoraemon 
                  ? 'border-system-cyan/30 text-system-cyan' 
                  : msg.sender === "SYSTEM ERROR" 
                    ? 'border-system-red/30 text-system-red'
                    : 'border-system-gray/30 text-system-gray'
              }`}>
                &gt; {msg.sender}
              </div>
              <div className={`p-4 border max-w-[80%] ${
                isDoraemon 
                  ? 'border-system-cyan/20 bg-system-cyan/5 text-white' 
                  : msg.sender === "SYSTEM ERROR"
                    ? 'border-system-red/20 bg-system-red/5 text-system-red'
                    : 'border-system-gray/20 bg-black/40 text-system-gray'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {voiceMode && voice.isListening && (
           <div className="flex flex-col items-end">
              <div className="px-2 py-1 mb-1 border text-[10px] uppercase tracking-wider border-system-gray/30 text-system-gray">
                &gt; LISTENING...
              </div>
              <div className="p-4 border max-w-[80%] border-system-gray/20 bg-black/40 text-system-gray italic">
                {voice.transcript || "..."}
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-system-gray/20 bg-black/40">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="text-system-cyan mt-3">&gt;</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-white border-b border-system-cyan/30 focus:border-system-cyan focus:outline-none px-2 py-2 font-mono placeholder:text-system-gray/30"
            placeholder={voiceMode ? "Voice mode active. Speak..." : "Awaiting input..."}
            disabled={voiceMode}
          />
        </form>
      </div>
    </div>
  );
}
