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
  Mic,
  MicOff,
  Copy,
  Check,
} from 'lucide-react';
import { speakAloud } from '@/lib/speech';
import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { getKnowledgeBase, getLocalSyncDiagnostics } from '@/lib/assistant/knowledgeStorage';

export interface AssistantCard {
  type: 'rate' | 'batch' | 'quality' | 'action' | 'info';
  title: string;
  subtitle?: string;
  items?: { label: string; value: string; highlight?: boolean }[];
  badge?: { label: string; variant?: 'success' | 'warning' | 'info' | 'neutral' };
  link?: { href: string; label: string };
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: string[];
  cards?: AssistantCard[];
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
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Hidden on /login and /design routes
  const isHidden = pathname?.startsWith('/login') || pathname?.startsWith('/design');

  // Surface detection
  let surface = 'public';
  if (pathname?.startsWith('/collector')) surface = 'collector';
  else if (pathname?.startsWith('/facilitator')) surface = 'facilitator';
  else if (pathname?.startsWith('/collection')) surface = 'collection';
  else if (pathname?.startsWith('/inventory')) surface = 'inventory';
  else if (pathname?.startsWith('/admin')) surface = 'admin';
  else if (pathname?.startsWith('/store')) surface = 'store';
  else if (pathname?.startsWith('/trade')) surface = 'trade';

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(Boolean(SpeechRec));
    }
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load configuration and suggestions
  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
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

      const diag = await getLocalSyncDiagnostics();
      setDiagnostics(diag);
    }

    init();
  }, []);

  // Update contextual suggestions when route or language changes
  useEffect(() => {
    if (surface === 'collector') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ଆଜିର ମହୁଆ ଦର କେତେ?', 'ମୋ ପ୍ରାପ୍ୟ କିପରି ହିସାବ ହୁଏ?', 'ତଥ୍ୟ ସିଙ୍କ୍ କାହିଁକି ହେଉନାହିଁ?', 'ବସ୍ତା ଓଜନ କାହିଁକି ବାଦ୍ ଦିଆଯାଏ?']
          : ['What are today rates?', 'How is my payout calculated?', 'Why is my data not syncing?', 'What is tare deduction?']
      );
    } else if (surface === 'store') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ଅନଲାଇନ୍ ଷ୍ଟୋର୍ କିପରି କାମ କରେ?', 'ଜଙ୍ଗଲୀ ମହୁ କିପରି କିଣିବି?', 'ଷ୍ଟୋରରେ କେଉଁ ସବୁ ଜିନିଷ ମିଳୁଛି?']
          : ['How does the retail store work?', 'Can consumers buy packaged forest honey?', 'What products are in stock?']
      );
    } else if (surface === 'trade') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ହୋଲସେଲ ବା ବଲ୍କ କ୍ରୟ କିପରି ହୁଏ?', 'ବି୨ବି (B2B) ଅର୍ଡର କିପରି କରିବି?', 'RFQ କିପରି ପଠାଇବି?']
          : ['How do B2B wholesale orders work?', 'How do I submit an RFQ?', 'What is the wholesale procurement process?']
      );
    } else if (surface === 'collection') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ବସ୍ତା ଓଜନ କାହିଁକି ବାଦ୍ ଦିଆଯାଏ?', 'ଫଟୋ କିପରି ଅପଲୋଡ୍ କରିବି?', 'ଓଜନ ଅସଙ୍ଗତି କିପରି ଯାଞ୍ଚ ହୁଏ?']
          : ['What is gross weight and tare weight?', 'How to upload evidence photo?', 'What is lot quarantine?']
      );
    } else if (surface === 'inventory') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ବନଜାତ ଦ୍ରବ୍ୟର ଆର୍ଦ୍ରତା ସୀମା କେତେ?', 'ସର୍ବାଧିକ ଶ୍ରିଙ୍କେଜ୍ କେତେ?', 'କ୍ୱାରେଣ୍ଟାଇନ୍ କିପରି ହୁଏ?']
          : ['What are standard shrinkage allowances?', 'What are the moisture limits for produce?', 'How to quarantine a lot?']
      );
    } else if (surface === 'admin') {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ଲାଭ (LABHA) ଯୋଜନା କ\'ଣ?', 'ଓଜନରେ ଅସଙ୍ଗତି ହେଲେ କ\'ଣ ହୁଏ?', 'ଆଦିବାସୀ ସଂଗ୍ରାହକମାନଙ୍କୁ କିପରି ୧୦୦% ମୂଲ୍ୟ ମିଳେ?']
          : ['What is the LABHA scheme?', 'Who resolves weight disputes?', 'Are platform fees deducted from collectors?']
      );
    } else {
      setSuggestedQuestions(
        locale === 'or'
          ? ['ସମଗ୍ନ କ\'ଣ?', 'ଏହା ସରକାରୀ ଆପ୍ କି?', 'କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?', 'ଲାଭ (LABHA) ଯୋଜନା କ\'ଣ?']
          : ['What is Samagna?', 'Is Samagna a government app?', 'How does QR verification work?', 'What is the LABHA scheme?']
      );
    }
  }, [pathname, locale, surface]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (isHidden || !enabled) return null;

  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert(
        locale === 'or'
          ? 'ଆପଣଙ୍କ ବ୍ରାଉଜରରେ ଭଏସ୍ ଇନପୁଟ୍ ଉପଲବ୍ଧ ନାହିଁ।'
          : 'Voice speech recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = locale === 'or' ? 'or-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const copyMessageText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isSending) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

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
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
          cards: data.cards || [],
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
          className="h-12 px-4 rounded-full bg-forest text-white shadow-lg hover:bg-forest-hover transition-all flex items-center gap-2 focus:outline-2 focus:outline-accent active:scale-95 group"
          aria-label="Open Maitriyam Guidance Assistant"
        >
          <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
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
          className="w-[92vw] sm:w-[390px] h-[540px] max-h-[85vh] bg-surface border border-rule rounded-[8px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-2.5 bg-forest text-white flex items-center justify-between border-b border-forest-hover shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-mono font-bold tracking-tight">
                    Maitriyam · ମୈତ୍ରିୟମ୍
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/15 text-white/90">
                    v0.2
                  </span>
                </div>
                <span className="text-[10px] text-white/70 block leading-none mt-0.5">
                  Automated Guidance Assistant · Non-Affiliated
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

              {/* Reset Chat Button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="p-1 rounded hover:bg-white/15 transition-colors text-white/80 hover:text-white"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/15 transition-colors text-white"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Odia Review Status Banner */}
          {locale === 'or' && (
            <div className="bg-warning/10 border-b border-warning/30 px-3 py-1 flex items-center gap-1.5 text-[10px] text-warning font-medium shrink-0">
              <AlertCircle size={12} className="shrink-0" />
              <span>ଓଡ଼ିଆ ଅନୁବାଦ ମାନବୀୟ ଯାଞ୍ଚ ଅପେକ୍ଷାରେ ଅଛି (Pending Human Review).</span>
            </div>
          )}

          {/* Conversation Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-bg">
            {messages.length === 0 && (
              <div className="text-center py-4 px-2 space-y-3">
                <div className="w-10 h-10 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    {locale === 'or' ? 'ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?' : 'How can I assist you today?'}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    {locale === 'or'
                      ? 'ଓଜନ, ଦର ସୂତ୍ର, QR ଯାଞ୍ଚ, B2B ହୋଲସେଲ ଏବଂ ଷ୍ଟୋର୍ କ୍ରୟ ବିଷୟରେ ପଚାରନ୍ତୁ।'
                      : 'Ask about MSP rates, weighment, QR provenance, B2B wholesale, or store orders.'}
                  </p>
                </div>

                {/* Quick Topic Tiles Grid */}
                <div className="grid grid-cols-2 gap-2 text-left pt-1">
                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'ଆଜିର ମହୁଆ ଦର କେତେ?' : 'What are today rates?')}
                    className="p-2 rounded-[5px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group"
                  >
                    <span className="text-[11px] font-bold text-ink group-hover:text-forest block">
                      💰 {locale === 'or' ? 'ଦର ଓ MSP' : 'Rates & MSP'}
                    </span>
                    <span className="text-[10px] text-ink-muted block leading-tight">
                      {locale === 'or' ? '୧୭ ବନଜାତ ଦ୍ରବ୍ୟର ସରକାରୀ ଦର' : 'Official rates for 17 MFP'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?' : 'How does QR verification work?')}
                    className="p-2 rounded-[5px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group"
                  >
                    <span className="text-[11px] font-bold text-ink group-hover:text-forest block">
                      🔍 {locale === 'or' ? 'QR ଯାଞ୍ଚ' : 'Traceability QR'}
                    </span>
                    <span className="text-[10px] text-ink-muted block leading-tight">
                      {locale === 'or' ? 'ବ୍ୟାଚ୍ ସ୍ରୋତ ଓ ପ୍ରମାଣପତ୍ର' : 'Verify batch origin & test'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'ହୋଲସେଲ ବା ବଲ୍କ କ୍ରୟ କିପରି ହୁଏ?' : 'How do B2B wholesale orders work?')}
                    className="p-2 rounded-[5px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group"
                  >
                    <span className="text-[11px] font-bold text-ink group-hover:text-forest block">
                      📦 {locale === 'or' ? 'B2B ହୋଲସେଲ' : 'B2B Wholesale'}
                    </span>
                    <span className="text-[10px] text-ink-muted block leading-tight">
                      {locale === 'or' ? 'ବ୍ୟବସାୟୀ କ୍ରୟ ଓ RFQ' : 'Bulk procurement & RFQ'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'ଲାଭ (LABHA) ଯୋଜନା କ\'ଣ?' : 'What is the LABHA scheme?')}
                    className="p-2 rounded-[5px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group"
                  >
                    <span className="text-[11px] font-bold text-ink group-hover:text-forest block">
                      🏛️ {locale === 'or' ? 'ଲାଭ ଯୋଜନା' : 'LABHA Scheme'}
                    </span>
                    <span className="text-[10px] text-ink-muted block leading-tight">
                      {locale === 'or' ? '୧୦୦% MSP ଗ୍ୟାରେଣ୍ଟି' : '100% MSP payout policy'}
                    </span>
                  </button>
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
                  className={`max-w-[88%] rounded-[6px] px-3 py-2 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-forest text-white'
                      : 'bg-surface border border-rule text-ink shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Structured Assistant Cards */}
                  {m.cards && m.cards.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {m.cards.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded-[5px] bg-bg border border-rule space-y-2 text-ink shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div>
                              <div className="text-[11px] font-bold text-ink leading-tight">{c.title}</div>
                              {c.subtitle && (
                                <div className="text-[10px] text-ink-muted leading-tight mt-0.5">{c.subtitle}</div>
                              )}
                            </div>
                            {c.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider shrink-0 ${
                                  c.badge.variant === 'success'
                                    ? 'bg-success-tint text-success'
                                    : c.badge.variant === 'warning'
                                    ? 'bg-warning-tint text-warning'
                                    : c.badge.variant === 'info'
                                    ? 'bg-forest/10 text-forest'
                                    : 'bg-bg-sunken text-ink-muted'
                                }`}
                              >
                                {c.badge.label}
                              </span>
                            )}
                          </div>

                          {c.items && c.items.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-rule/60 text-[10px]">
                              {c.items.map((it, itIdx) => (
                                <div key={itIdx} className="space-y-0.5">
                                  <span className="text-ink-subtle block text-[9px] font-mono uppercase">{it.label}</span>
                                  <span className={`block font-semibold ${it.highlight ? 'text-forest font-mono text-[11px]' : 'text-ink'}`}>
                                    {it.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {c.link && (
                            <a
                              href={c.link.href}
                              className="mt-1 pt-1.5 border-t border-rule/60 flex items-center justify-between text-[10px] font-medium text-forest hover:text-forest-hover transition-colors group"
                            >
                              <span>{c.link.label}</span>
                              <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Bar for Assistant Answers */}
                  {m.sender === 'assistant' && (
                    <div className="mt-2 pt-1.5 border-t border-rule/50 flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                      <div className="flex items-center gap-2">
                        {/* Audio Playback */}
                        <button
                          type="button"
                          onClick={() => speakAloud(m.text, locale === 'or' ? 'or-IN' : 'en-IN')}
                          className="hover:text-accent flex items-center gap-1 transition-colors"
                          title="Listen to this answer"
                        >
                          <Volume2 size={12} />
                          <span>{locale === 'or' ? 'ଶୁଣନ୍ତୁ' : 'Listen'}</span>
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => copyMessageText(m.id, m.text)}
                          className="hover:text-accent flex items-center gap-1 transition-colors"
                          title="Copy message"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check size={12} className="text-success" />
                              <span className="text-success">{locale === 'or' ? 'କପି ହେଲା' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>{locale === 'or' ? 'କପି' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>

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
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted italic py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-ping" />
                <span>Checking verified guidance ledger...</span>
              </div>
            )}
          </div>

          {/* Contextual Suggestions Bar */}
          {suggestedQuestions.length > 0 && (
            <div className="p-2 border-t border-rule bg-surface/90 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
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

          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className="px-3 py-1.5 bg-terracotta/10 border-t border-terracotta/30 text-terracotta text-[11px] flex items-center justify-between animate-pulse shrink-0">
              <div className="flex items-center gap-1.5 font-medium">
                <Mic size={14} className="animate-bounce" />
                <span>
                  {locale === 'or' ? 'ଶୁଣୁଛି... ଆପଣଙ୍କ ପ୍ରଶ୍ନ କୁହନ୍ତୁ' : 'Listening... Speak your question now'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="text-[10px] underline font-semibold"
              >
                {locale === 'or' ? 'ବନ୍ଦ କରନ୍ତୁ' : 'Stop'}
              </button>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2 bg-surface border-t border-rule flex items-center gap-1.5 shrink-0"
          >
            <label htmlFor="maitriyam-chat-input" className="sr-only">
              {locale === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ' : 'Ask a question'}
            </label>
            <input
              id="maitriyam-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? locale === 'or' ? 'ଶୁଣୁଛି...' : 'Listening...'
                  : locale === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ ବା ମାଇକ୍ ଦବାନ୍ତୁ...' : 'Ask a question or tap mic...'
              }
              className="flex-1 px-3 py-1.5 rounded-[4px] border border-rule bg-bg text-xs text-ink focus:outline-2 focus:outline-accent"
              maxLength={500}
            />

            {/* Voice Microphone Input Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!voiceSupported || isSending}
              aria-label={isListening ? 'Stop listening' : 'Start voice speech input'}
              title={
                !voiceSupported
                  ? 'Voice speech recognition not supported in browser'
                  : isListening
                  ? 'Stop recording'
                  : 'Speak question aloud'
              }
              className={`h-8 w-8 rounded-[4px] flex items-center justify-center transition-all shrink-0 ${
                isListening
                  ? 'bg-terracotta text-white animate-pulse shadow-md ring-2 ring-terracotta/40'
                  : 'border border-rule hover:border-forest/60 bg-bg text-ink-muted hover:text-forest'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send query"
              className="h-8 px-3 rounded-[4px] bg-forest hover:bg-forest-hover disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
