'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  User,
  Bot,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Stethoscope,
  Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TrialEligibilityChatProps {
  trial: any;
  patientProfile?: any;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialEligibilityChat({
  trial,
  patientProfile,
  className = '',
}: TrialEligibilityChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && hasStarted) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasStarted]);

  const startChat = useCallback(async () => {
    setHasStarted(true);
    setIsLoading(true);
    setError(null);

    // Initial message from user to kick off the conversation
    const initMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Hi, I'd like to find out if I might be eligible for this clinical trial: ${trial.briefTitle} (${trial.nctId}). Can you help me understand the requirements?`,
      timestamp: new Date(),
    };

    try {
      const res = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trial,
          messages: [{ role: 'user', content: initMessage.content }],
          patientProfile,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      // Only show the assistant's intro, not the user's init message
      setMessages([assistantMessage]);
    } catch (err: any) {
      console.error('Eligibility chat error:', err);
      setError(err.message || 'Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  }, [trial, patientProfile]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build full conversation history for context
      const allMessages = [...messages, userMessage];
      const apiMessages = allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trial,
          messages: apiMessages,
          patientProfile,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Eligibility chat error:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, trial, patientProfile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setHasStarted(false);
    setError(null);
    setInput('');
  };

  // ── Launch button (not opened yet) ─────────────────────────────────────
  if (!isOpen) {
    return (
      <div className={className}>
        <button
          onClick={() => {
            setIsOpen(true);
            if (!hasStarted) startChat();
          }}
          className="group w-full card p-6 transition-all hover:shadow-lg hover:border-secondary-300 dark:hover:border-secondary-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-700 flex items-center justify-center shadow-lg shadow-secondary-500/20 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display font-semibold text-lg">
                Am I Eligible?
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Answer a few questions to see if this trial might be a match for you
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 text-sm font-medium group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/50 transition-colors">
              Start Chat
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ── Chat panel ─────────────────────────────────────────────────────────
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">
                Am I Eligible?
              </h3>
              <p className="text-secondary-100 text-xs truncate max-w-[200px] sm:max-w-none">
                {trial.briefTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={resetChat}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Start over"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Minimize"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            This is a preliminary check only — <strong>not a medical determination</strong>. 
            Only the trial&apos;s research team can confirm eligibility.
          </span>
        </p>
      </div>

      {/* Messages area */}
      <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-surface-50 dark:bg-surface-900/50">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'assistant'
                    ? 'bg-gradient-to-br from-secondary-500 to-secondary-700'
                    : 'bg-primary-600'
                }`}
              >
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'assistant'
                    ? 'bg-white dark:bg-surface-800 shadow-sm border border-surface-200 dark:border-surface-700'
                    : 'bg-primary-600 text-white'
                }`}
              >
                <MessageContent
                  content={message.content}
                  isAssistant={message.role === 'assistant'}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-surface-800 shadow-sm border border-surface-200 dark:border-surface-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-secondary-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.25,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (messages.length === 0) startChat();
              }}
              className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Waiting for response...' : 'Type your answer...'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-secondary-600 text-white flex items-center justify-center hover:bg-secondary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick responses */}
        {messages.length > 0 && messages.length < 3 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {getQuickResponses(trial).map((quick, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(quick);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors text-surface-600 dark:text-surface-400"
              >
                {quick}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message content renderer — handles emoji markers in assessment
// ─────────────────────────────────────────────────────────────────────────────
function MessageContent({
  content,
  isAssistant,
}: {
  content: string;
  isAssistant: boolean;
}) {
  if (!isAssistant) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    );
  }

  // Parse assistant messages for assessment markers
  const lines = content.split('\n');

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // ✅ Met criteria
        if (trimmed.startsWith('✅')) {
          return (
            <div
              key={i}
              className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{trimmed.slice(1).trim()}</span>
            </div>
          );
        }

        // ❌ Not met
        if (trimmed.startsWith('❌')) {
          return (
            <div
              key={i}
              className="flex items-start gap-2 text-red-600 dark:text-red-400"
            >
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{trimmed.slice(1).trim()}</span>
            </div>
          );
        }

        // ❓ Unclear
        if (trimmed.startsWith('❓')) {
          return (
            <div
              key={i}
              className="flex items-start gap-2 text-amber-600 dark:text-amber-400"
            >
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{trimmed.slice(1).trim()}</span>
            </div>
          );
        }

        // Bold text (simple markdown)
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-surface-900 dark:text-surface-100">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        // Regular text
        return (
          <p
            key={i}
            className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick response suggestions based on trial type
// ─────────────────────────────────────────────────────────────────────────────
function getQuickResponses(trial: any): string[] {
  const responses: string[] = [];

  if (trial.conditions?.length > 0) {
    const condition = trial.conditions[0];
    responses.push(`I have ${condition}`);
  }

  if (trial.stages?.length > 0) {
    responses.push(`I'm ${trial.stages[0]}`);
  }

  responses.push("I haven't started treatment yet");
  responses.push("I've had prior treatment");

  return responses.slice(0, 4);
}
