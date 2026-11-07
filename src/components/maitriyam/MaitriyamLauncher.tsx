'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  X,
  Send,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Volume2,
  ChevronRight,
  ExternalLink,
  WifiOff,
  Languages,
} from 'lucide-react';
import { speakAloud } from '@/lib/speech';
import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { getKnowledgeBase, getLocalSyncDiagnostics } from '@/lib/assistant/knowledgeStorage';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: string[];
  offline?: boolean;
  timestamp: string;
}

export default function MaitriyamLauncher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [locale, setLocale] = useState<'en' | 'or'>('en');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Hidden on /login and /design routes
  const isHidden = pathname?.startsWith('/login') || pathname?.startsWith('/design');

  // Surface detection
  let surface = 'public';
  if (pathname?.startsWith('/collector')) surface = 'collector';
  else if (pathname?.startsWith('/facilitator')) surface = 'facilitator';
  else if (pathname?.startsWith('/collection')) surface = 'collection';
  else if (pathname?.startsWith('/inventory')) surface = 'inventory';
  else if (pathname?.startsWith('/admin')) surface = 'admin';

  // Load configuration and suggestions
  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
        window.addEventListener('online', () => setIsOffline(false));
        window.addEventListener('offline', () => setIsOffline(true));
      }

      try {
        const res = await fetch('/api/assistant/config');
        if (res.ok) {
          const cfg = await res.json();
          setEnabled(cfg.enabled);
        }
      } catch {
        // Fallback to local offline mode
      }

      // Populate tap-first suggestions by surface & role
      if (surface === 'collector') {
        setSuggestedQuestions(
          locale === 'or'
            ? ['ମୋ ପ୍ରାପ୍ୟ କିପରି ହିସାବ ହୁଏ?', 'ତଥ୍ୟ ସିଙ୍କ୍ କାହିଁକି ହେଉନାହିଁ?', 'ଆଜିର ମହୁଆ ଦର କେତେ?']
            : ['How is my payout calculated?', 'Why is my data not syncing?', 'What are today rates?']
        );
      } else if (surface === 'collection') {
        setSuggestedQuestions(
          locale === 'or'
            ? ['ବସ୍ତା ଓଜନ କାହିଁକି ବାଦ୍ ଦିଆଯାଏ?', 'ଫଟୋ କିପରି ଅପଲୋଡ୍ କରିବି?']
            : ['What is gross weight and tare weight?', 'How to upload evidence photo?']
        );
      } else if (surface === 'admin') {
        setSuggestedQuestions(['Who handles conflicts?', 'Are platform fees deducted from collectors?']);
      } else {
        setSuggestedQuestions(
          locale === 'or'
            ? ['ସମଗ୍ନ କ\'ଣ?', 'ଏହା ସରକାରୀ ଆପ୍ କି?', 'କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?']
            : ['What is Samagna?', 'Is Samagna a government app?', 'How does QR verification work?']
        );
      }

      const diag = await getLocalSyncDiagnostics();
      setDiagnostics(diag);
    }

    init();
  }, [pathname, locale, surface]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (isHidden || !enabled) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isSending) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    // If offline or fast local path:
    if (isOffline) {
      const kb = await getKnowledgeBase(locale);
      const matched = matchKnowledgeBase(textToSend, kb, surface.toUpperCase(), surface, locale);

      setTimeout(() => {
        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: matched.entry
            ? matched.entry.answer
            : locale === 'or'
            ? 'ଅଫଲାଇନ୍ ମୋଡ୍ ରେ ଏହି ପ୍ରଶ୍ନର ଉତ୍ତର ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ରସିଦ ଦେଖନ୍ତୁ ବା ନେଟୱର୍କ ଆସିବା ପରେ ପଚାରନ୍ତୁ।'
            : 'I do not have an offline answer for this query. Please consult your latest receipt or ask when online.',
          citations: matched.entry ? [matched.entry.sourceRef] : ['/about'],
          offline: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsSending(false);
      }, 150);
      return;
    }

    // Online request with AbortController 3s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const endpoint = surface === 'public' ? '/api/public/assistant/chat' : '/api/assistant/chat';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
        body: JSON.stringify({
          message: textToSend,
          locale,
          surface,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const asstMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          citations: data.citations || [],
          offline: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, asstMsg]);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      // Degrade to local offline matcher
      const kb = await getKnowledgeBase(locale);
      const matched = matchKnowledgeBase(textToSend, kb, surface.toUpperCase(), surface, locale);
      const fallbackMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: matched.entry
          ? matched.entry.answer
          : 'Maitriyam is temporarily running in offline mode. Please check the /about page or consult your local field supervisor.',
        citations: matched.entry ? [matched.entry.sourceRef] : ['/about'],
        offline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden font-sans">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-12 px-4 rounded-full bg-forest text-white shadow-lg hover:bg-forest-hover transition-all flex items-center gap-2 focus:outline-2 focus:outline-accent active:scale-95"
          aria-label="Open Maitriyam Guidance Assistant"
        >
          <MessageSquare size={18} />
          <span className="text-xs font-mono font-bold tracking-wide">
            {locale === 'or' ? 'ମୈତ୍ରିୟମ୍' : 'Maitriyam'}
          </span>
          {isOffline && (
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Running in offline mode" />
          )}
        </button>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Maitriyam In-App Assistant"
          className="w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-surface border border-rule rounded-[8px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-forest text-white flex items-center justify-between border-b border-forest-hover">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" />
              <div>
                <h3 className="text-xs font-mono font-bold tracking-tight">
                  Maitriyam · ମୈତ୍ରିୟମ୍
                </h3>
                <span className="text-[10px] text-white/70 block leading-none">
                  Automated Guidance Assistant · Non-Affiliated
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'or' : 'en')}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
                title="Switch Language (English / ଓଡ଼ିଆ)"
              >
                <Languages size={11} />
                <span>{locale === 'en' ? 'ଓଡ଼ିଆ' : 'EN'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Odia Review Status Banner */}
          {locale === 'or' && (
            <div className="bg-warning/10 border-b border-warning/30 px-3 py-1 flex items-center gap-1.5 text-[10px] text-warning font-medium">
              <AlertCircle size={12} className="shrink-0" />
              <span>ଓଡ଼ିଆ ଅନୁବାଦ ମାନବୀୟ ଯାଞ୍ଚ ଅପେକ୍ଷାରେ ଅଛି (Pending Human Review).</span>
            </div>
          )}

          {/* Conversation Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg">
            {messages.length === 0 && (
              <div className="text-center py-6 px-2 space-y-3">
                <div className="w-10 h-10 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    {locale === 'or' ? 'ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?' : 'How can I assist you today?'}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    {locale === 'or'
                      ? 'ମୁଁ ସମଗ୍ନ ପାଇଁ ଏକ ସ୍ୱୟଂଚାଳିତ ସହାୟକ। ଓଜନ, ଦର ସୂତ୍ର ଏବଂ QR ଯାଞ୍ଚ ବିଷୟରେ ପଚାରନ୍ତୁ।'
                      : 'I am an automated guidance assistant for Samagna. Ask about weighment, rate formulas, or QR verification.'}
                  </p>
                </div>

                {/* Pilot Disclaimer Pill */}
                <div className="p-2.5 rounded-[4px] bg-surface border border-rule text-[10px] text-ink-muted text-left space-y-1">
                  <div className="font-bold text-ink flex items-center gap-1">
                    <AlertCircle size={12} className="text-accent" />
                    <span>Independent Pilot Notice</span>
                  </div>
                  <p>
                    Samagna is an independent demonstrator. Payouts and government royalty figures are simulated.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[6px] px-3 py-2 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-forest text-white'
                      : 'bg-surface border border-rule text-ink shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Read Aloud Button for Assistant Answers */}
                  {m.sender === 'assistant' && (
                    <div className="mt-2 pt-1.5 border-t border-rule/50 flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                      <button
                        type="button"
                        onClick={() => speakAloud(m.text, locale === 'or' ? 'or-IN' : 'en-IN')}
                        className="hover:text-accent flex items-center gap-1"
                        title="Listen to this answer"
                      >
                        <Volume2 size={12} />
                        <span>{locale === 'or' ? 'ଶୁଣନ୍ତୁ' : 'Listen'}</span>
                      </button>

                      {m.offline && (
                        <span className="flex items-center gap-1 text-warning">
                          <WifiOff size={10} />
                          <span>Offline Cached</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Citation Pills */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.citations.map((cite, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-[2px] bg-bg-sunken text-[9px] font-mono text-ink-muted"
                        >
                          Source: {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-ink-subtle mt-0.5 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-ink-muted italic">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>Checking verified guidance ledger...</span>
              </div>
            )}
          </div>

          {/* Tap-First Suggestions Bar */}
          {suggestedQuestions.length > 0 && (
            <div className="p-2 border-t border-rule bg-surface/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-[10px] font-mono text-ink-subtle uppercase shrink-0">Tap:</span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 rounded-full bg-bg-sunken hover:bg-rule/70 text-ink whitespace-nowrap text-[10px] font-medium transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-surface border-t border-rule flex items-center gap-2"
          >
            <label htmlFor="maitriyam-chat-input" className="sr-only">
              {locale === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ' : 'Ask a question'}
            </label>
            <input
              id="maitriyam-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={locale === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ...' : 'Ask a question...'}
              className="flex-1 px-3 py-1.5 rounded-[4px] border border-rule bg-bg text-xs text-ink focus:outline-2 focus:outline-accent"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="h-8 px-3 rounded-[4px] bg-forest hover:bg-forest-hover disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
