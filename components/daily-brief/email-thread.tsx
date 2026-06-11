import { X, Reply, CornerUpLeft, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { useState } from 'react';

interface EmailThreadProps {
  emailId: string;
  subject: string;
  sender: string;
  snippet: string;
  threadId?: string;
  onClose: () => void;
}

export function EmailThread({ emailId, subject, sender, snippet, threadId, onClose }: EmailThreadProps) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Default to next hour
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  // Format for datetime-local: YYYY-MM-DDThh:mm
  const defaultDateTime = nextHour.toISOString().slice(0, 16);
  
  const [startTime, setStartTime] = useState(defaultDateTime);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/mail/${emailId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText, threadId, to: sender, subject })
      });
      if (res.ok) {
        setReplyText('');
        onClose();
      }
    } catch (error) {
      console.error('Failed to reply', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!startTime) return;
    setIsScheduling(true);
    try {
      // Parse local datetime-local back to Date object
      const startObj = new Date(startTime);
      const endObj = new Date(startObj.getTime() + 30 * 60000); // +30 mins

      const res = await fetch('/api/calendar/from-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          title: `Meeting: ${subject}`,
          description: `Scheduled from email:\n\n${snippet}`,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          attendees: [sender]
        })
      });
      if (res.ok) {
        setShowSchedule(false);
        onClose();
      }
    } catch (error) {
      console.error('Failed to schedule', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-border bg-background/95 backdrop-blur-xl shadow-2xl transition-transform flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <h2 className="font-semibold truncate pr-4">{subject}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <CalendarIcon className="h-3 w-3" />
            Schedule
          </button>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {sender[0]?.toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="font-medium text-sm truncate">{sender}</p>
              <p className="text-xs text-muted-foreground">To: you</p>
            </div>
          </div>
          <div className="text-sm leading-relaxed text-foreground/90">
            <p>{snippet}</p>
          </div>
        </div>

        {showSchedule && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 animate-in slide-in-from-top-2 duration-200">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-blue-500">
              <CalendarIcon className="h-4 w-4" /> Schedule a Meeting
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> When? (30 mins)
                </label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> With
                </label>
                <div className="w-full rounded-lg border border-border/50 bg-card/50 p-2.5 text-sm text-foreground/80 cursor-not-allowed">
                  {sender}
                </div>
              </div>

              <button
                onClick={handleSchedule}
                disabled={isScheduling || !startTime}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 p-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors mt-2"
              >
                {isScheduling ? 'Scheduling...' : 'Create Calendar Event'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/50 bg-card/50 p-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background p-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            className="w-full resize-none bg-transparent text-sm focus:outline-none min-h-[100px]"
            placeholder={`Reply to ${sender}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CornerUpLeft className="h-3 w-3" /> Reply via Supereye
            </div>
            <button
              onClick={handleSendReply}
              disabled={isSending || !replyText.trim()}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Reply className="h-3 w-3" />
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
