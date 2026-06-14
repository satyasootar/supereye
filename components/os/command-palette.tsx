'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useTheme } from 'next-themes';
import { Search, Mail, Calendar, Sparkles, Settings, Moon, TerminalSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Command = {
  id: string;
  category: string;
  label: string;
  icon: any;
  shortcut?: string;
  action: () => void;
};

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, openTab, setWorkspaceMode } = useAppStore();
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      
      // Handle escape
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCommandPaletteOpen]);

  const commands: Command[] = [
    // Recently Used
    { id: 'compose-email', category: 'Recently Used', label: 'Compose new email', icon: Mail, shortcut: 'C', action: () => openTab('email') },
    { id: 'create-event', category: 'Recently Used', label: 'Create event', icon: Calendar, shortcut: 'N', action: () => { openTab('email'); setWorkspaceMode('calendar'); } },
    // Email Actions
    { id: 'go-inbox', category: 'Email Actions', label: 'Go to Inbox', icon: Mail, shortcut: 'G I', action: () => openTab('email') },
    { id: 'go-sent', category: 'Email Actions', label: 'Go to Sent', icon: Mail, shortcut: 'G S', action: () => openTab('email') },
    
    // Calendar Actions
    { id: 'go-today', category: 'Calendar Actions', label: 'Go to today', icon: Calendar, shortcut: 'T', action: () => { openTab('email'); setWorkspaceMode('calendar'); } },
    { id: 'switch-month', category: 'Calendar Actions', label: 'Switch to month view', icon: Calendar, shortcut: 'M', action: () => { openTab('email'); setWorkspaceMode('calendar'); } },
    
    // App
    { id: 'settings', category: 'App', label: 'Open Settings', icon: Settings, shortcut: '⌘,', action: () => {} },
    { id: 'theme', category: 'App', label: 'Toggle dark/light mode', icon: Moon, action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { id: 'shortcuts', category: 'App', label: 'Show keyboard shortcuts', icon: TerminalSquare, shortcut: '?', action: () => {} },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) || 
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedIndex, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  let absoluteIndex = 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-bg-app/70 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-[640px] rounded-2xl bg-bg-elevated border border-border-strong shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        >
          {/* Input Header */}
          <div className="flex items-center px-4 border-b border-border-subtle flex-shrink-0">
            <Search className="h-5 w-5 text-text-muted mr-3" />
            <input 
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 h-[52px] bg-transparent text-[16px] text-text-primary outline-none placeholder:text-text-muted font-sans"
            />
            <span className="text-[11px] font-mono text-text-muted px-2 py-1 rounded bg-bg-overlay">ESC</span>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const currentIndex = absoluteIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <div 
                      key={cmd.id}
                      className={cn(
                        "flex items-center justify-between px-3 h-[40px] rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-accent-blue text-white" : "text-text-primary hover:bg-bg-overlay"
                      )}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={() => {
                        cmd.action();
                        setCommandPaletteOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <cmd.icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-text-secondary")} />
                        <span className="text-[14px] font-medium">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <span className={cn(
                          "text-[11px] font-mono px-1.5 py-0.5 rounded",
                          isSelected ? "bg-white/20 text-white" : "bg-bg-overlay text-text-secondary"
                        )}>
                          {cmd.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="py-14 text-center text-[14px] text-text-muted">
                No results found.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
