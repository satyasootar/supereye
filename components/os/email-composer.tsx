'use client';

import { useState } from 'react';
import { 
  CornerUpLeft, X, MoreHorizontal, ChevronDown,
  Wand2, Paperclip, Code, Calendar as CalendarIcon, Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailComposerProps {
  onClose: () => void;
  defaultTo: string;
}

export function EmailComposer({ onClose, defaultTo }: EmailComposerProps) {
  const [showCcBcc, setShowCcBcc] = useState(false);

  return (
    <div className="flex flex-col rounded-xl bg-[#2A2A2A] text-white shadow-xl overflow-hidden mt-6 mb-8 border border-white/5">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition-colors">
            <CornerUpLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3A3A3A] text-[13px] text-gray-200">
            {defaultTo}
            <button className="ml-1 text-gray-400 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-gray-400">
          <button 
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="hover:text-white transition-colors"
          >
            Cc / Bcc
          </button>
          <button className="hover:text-white transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cc / Bcc Expanded Rows */}
      {showCcBcc && (
        <div className="flex flex-col border-b border-white/5 px-4">
          <div className="flex items-center gap-6 py-2">
            <span className="text-[13px] text-gray-400 w-6">Cc</span>
            <input 
              type="text" 
              placeholder="Add recipient" 
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-gray-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-6 py-2 border-t border-white/5">
            <span className="text-[13px] text-gray-400 w-6">Bcc</span>
            <input 
              type="text" 
              placeholder="Add recipient" 
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-gray-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="relative p-4">
        <textarea 
          autoFocus
          placeholder='Write, or press "space" for AI, "/" for commands...'
          className="w-full min-h-[250px] bg-transparent resize-none outline-none text-[14px] text-white placeholder:text-gray-500 leading-relaxed"
        />
        
        {/* Floating AI Action */}
        <button className="absolute right-4 top-4 flex items-center justify-center bg-white rounded-full px-2 py-1 shadow-lg group hover:scale-105 transition-transform">
          <div className="flex items-center gap-1">
            <Wand2 className="h-3.5 w-3.5 text-teal-600" />
            <div className="h-4 w-4 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
              G
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-l-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium transition-colors">
            Send
          </button>
          <button className="flex items-center justify-center px-2 py-1.5 rounded-r-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-l border-white/20 transition-colors">
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-gray-400">
          <button className="p-1.5 hover:bg-white/10 hover:text-white rounded-md transition-colors">
            <Wand2 className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 hover:text-white rounded-md transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 hover:text-white rounded-md transition-colors">
            <Code className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 hover:text-white rounded-md transition-colors">
            <CalendarIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 hover:text-red-400 rounded-md transition-colors ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
