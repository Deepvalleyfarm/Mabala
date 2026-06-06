import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, ChevronDown, Send, Sparkles, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "hercules";
  text: string;
  timestamp: string;
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "hercules",
      text: "Hello! I am Hercules AI, your Mabala Agriculture Accounting & Farms co-pilot. Ask me anything about FCR calculations, double-entry mapping codes (like Debiting 1010 Bank / Crediting 4100), Zambia PAYE bands, NHIMA, or setting up a crop cycle!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString() + "-user",
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages.map(m => ({ role: m.sender === "user" ? "user" : "model", text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Hercules API");
      }

      const data = await response.json();
      const aiMsg: Message = {
        id: Date.now().toString() + "-ai",
        sender: "hercules",
        text: data.text || "I apologize, I didn't get that. How can I assist you with Mabala accounting?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errMsg: Message = {
        id: Date.now().toString() + "-err",
        sender: "hercules",
        text: "Offline/Demo Mode Response: I noticed an issue connecting to the Gemini server, but here is some advice based on our core database. Remember that ZMW and generic African currencies drive all accounting! Feed purchases automatically post to Dr 5200 (Aquafeed) or Dr 5210 (Poultry Feed) and Cr 1010 (Bank). Let me know how else I can help!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      {/* Closed Button Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-all border border-emerald-400/20"
          title="Ask Hercules AI Co-pilot"
          id="btn-bot-toggle"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20 text-sm">
                H
              </div>
              <div>
                <h4 className="font-extrabold text-xs tracking-tight">Hercules AI</h4>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] text-slate-400 font-mono">Agricultural Co-pilot (Active)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                    isUser 
                      ? "bg-slate-800 text-white rounded-br-none" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block text-right font-mono">{m.timestamp}</span>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-3 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="font-mono text-[10px] ml-1">Typing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              placeholder="Ask about water Quality, PAYE or CoA codes..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 text-xs border rounded-xl px-3 py-2 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500 transition-all focus:ring-4 focus:ring-emerald-500/5"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
