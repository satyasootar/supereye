'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, Mail, Calendar, Globe, Paperclip, ClipboardPaste, 
  ArrowUp, Sparkles, X, Edit, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  time: string;
  actionCard?: {
    type: 'calendar' | 'email';
    title: string;
    details: string;
    subdetails?: string;
  };
};

export function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [modes, setModes] = useState({
    agent: true,
    email: false,
    calendar: false,
    web: false
  });
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const QUICK_CARDS = [
    { icon: <Mail className="h-5 w-5 text-accent-blue" />, text: "Draft an email to..." },
    { icon: <Calendar className="h-5 w-5 text-green-500" />, text: "Check my schedule for..." },
    { icon: <Sparkles className="h-5 w-5 text-indigo-500" />, text: "Summarize unread emails" },
    { icon: <Globe className="h-5 w-5 text-orange-500" />, text: "Find latest news about..." }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative overflow-hidden">
      
      {/* Context Injection Banner (Mock example when Email Context is ON) */}
      {modes.email && (
        <div className="absolute top-0 left-0 right-0 z-10 m-4 flex items-center justify-between px-4 py-2 rounded-lg bg-accent-blue-glow border border-accent-blue/30 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent-blue" />
            <span className="text-[12.5px] font-medium text-text-primary">
              Context: "New formula editor in Tally" — Marie, Jun 11
            </span>
          </div>
          <button 
            onClick={() => setModes({ ...modes, email: false })}
            className="text-text-secondary hover:text-text-primary text-[12px] font-medium flex items-center gap-1 transition-colors"
          >
            Clear <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Messages Area / Empty State */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-16 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="h-16 w-16 mb-6 rounded-2xl bg-gradient-to-tr from-accent-blue to-indigo-500 flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">How can I help you today?</h2>
            <p className="text-text-muted text-[14px] mb-12">I can manage your calendar, draft emails, and fetch information.</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-[600px] w-full">
              {QUICK_CARDS.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(card.text)}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border border-border-default bg-bg-surface hover:border-accent-blue hover:bg-bg-elevated transition-all text-left group shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-bg-base border border-border-subtle group-hover:bg-bg-surface transition-colors">
                    {card.icon}
                  </div>
                  <span className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                    {card.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-[720px] mx-auto flex flex-col gap-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-1 w-full",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-text-primary">Corsair AI</span>
                    <span className="text-[11px] font-mono text-text-muted">{msg.time}</span>
                  </div>
                )}

                {/* Message Bubble */}
                {msg.text && (
                  <div className={cn(
                    "px-4 py-3 text-[14px] leading-relaxed max-w-[80%]",
                    msg.role === 'user' 
                      ? "bg-accent-blue text-white rounded-[20px] rounded-br-[4px]" 
                      : "bg-bg-surface border border-border-default text-text-primary rounded-[16px] rounded-tl-[4px]"
                  )}>
                    {msg.text}
                  </div>
                )}

                {/* Embedded Action Card */}
                {msg.actionCard && (
                  <div className="mt-2 w-[80%] rounded-xl border border-border-strong bg-bg-elevated overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface/50">
                      <div className="flex items-center gap-2 font-semibold text-[13px] text-text-primary">
                        {msg.actionCard.type === 'calendar' ? <Calendar className="h-4 w-4 text-accent-blue" /> : <Mail className="h-4 w-4 text-accent-blue" />}
                        {msg.actionCard.type === 'calendar' ? 'New Event' : 'Draft Email'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 rounded text-[12px] font-medium text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors">Edit</button>
                        <button className="px-2 py-1 rounded text-[12px] font-medium text-text-secondary hover:bg-bg-overlay hover:text-text-primary transition-colors">Send</button>
                      </div>
                    </div>
                    <div className="px-4 py-3 text-[13.5px]">
                      <div className="font-semibold text-text-primary mb-1">{msg.actionCard.title}</div>
                      <div className="text-text-secondary">{msg.actionCard.details}</div>
                    </div>
                  </div>
                )}

                {msg.role === 'user' && (
                  <div className="flex items-center gap-2 mt-1 mr-1">
                    <span className="text-[11px] font-mono text-text-muted">{msg.time}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg-base via-bg-base to-transparent">
        <div className="max-w-[720px] mx-auto flex flex-col bg-bg-elevated border border-border-strong rounded-xl shadow-lg focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue transition-all overflow-hidden">
          
          {/* Modes Row */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto no-scrollbar">
            <button 
              type="button"
              onClick={() => setModes({ ...modes, agent: !modes.agent })}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors flex-shrink-0", modes.agent ? "bg-accent-blue text-white" : "bg-bg-overlay text-text-secondary hover:text-text-primary")}
            >
              <Bot className="h-3.5 w-3.5" /> Agent Mode
            </button>
            <button 
              type="button"
              onClick={() => setModes({ ...modes, email: !modes.email })}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors flex-shrink-0", modes.email ? "bg-accent-blue text-white" : "bg-bg-overlay text-text-secondary hover:text-text-primary")}
            >
              <Mail className="h-3.5 w-3.5" /> Email Context
            </button>
            <button 
              type="button"
              onClick={() => setModes({ ...modes, calendar: !modes.calendar })}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors flex-shrink-0", modes.calendar ? "bg-accent-blue text-white" : "bg-bg-overlay text-text-secondary hover:text-text-primary")}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar Context
            </button>
            <button 
              type="button"
              onClick={() => setModes({ ...modes, web: !modes.web })}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors flex-shrink-0", modes.web ? "bg-accent-blue text-white" : "bg-bg-overlay text-text-secondary hover:text-text-primary")}
            >
              <Globe className="h-3.5 w-3.5" /> Web Search
            </button>
          </div>

          {/* Text Area */}
          <textarea 
            aria-label="Ask Corsair a question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Corsair anything... Schedule meetings, reply to email, summarize threads..."
            className="w-full min-h-[60px] max-h-[200px] bg-transparent resize-none outline-none text-[14.5px] text-text-primary placeholder:text-text-muted px-4 py-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Send message logic
                if (input.trim()) setInput('');
              }
            }}
          />

          {/* Action Row */}
          <div className="flex items-center justify-between px-3 py-2 bg-bg-surface/50">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Attach file" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors" title="Attach">
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Paste context" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors" title="Paste Context">
                <ClipboardPaste className="h-4 w-4" />
              </button>
              <button type="button" className="px-2 py-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-md transition-colors text-[12.5px] font-medium font-mono">
                /cmds
              </button>
            </div>
            
            <button 
              type="button"
              aria-label="Send message"
              disabled={!input.trim()}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                input.trim() ? "bg-accent-blue text-white hover:bg-accent-blue-dim shadow-sm" : "bg-bg-overlay text-text-muted cursor-not-allowed"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
