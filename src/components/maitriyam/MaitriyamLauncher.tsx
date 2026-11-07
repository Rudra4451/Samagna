'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  X,
  Send,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  WifiOff,
  Languages,
  Mic,
  MicOff,
  Copy,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';
import { speakAloud, stopSpeech } from '@/lib/speech';
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
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendRef = useRef<((questionText?: string, fromVoice?: boolean) => Promise<void>) | null>(null);

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

  // Escape key closes modal & stops speech
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        stopSpeech();
        setIsAssistantSpeaking(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load configuration and diagnostics
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
          ? ['ସମଗ୍ନ କ\'ଣ?', 'ଆଜିର ମହୁଆ ଦର କେତେ?', 'କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?', 'ଲାଭ (LABHA) ଯୋଜନା କ\'ଣ?']
          : ['What is Samagna?', 'What are today rates?', 'How does QR verification work?', 'What is the LABHA scheme?']
      );
    }
  }, [pathname, locale, surface]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isListening]);

  // Voice recognition start/stop handler
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert(
        locale === 'or'
          ? 'ଆପଣଙ୍କ ବ୍ରାଉଜରରେ ଭଏସ୍ ଇନପୁଟ୍ ଉପଲବ୍ଧ ନାହିଁ।'
          : 'Voice speech recognition is not supported in this browser. Please type your query.'
      );
      return;
    }

    // Stop existing speech synthesis if speaking
    stopSpeech();
    setIsAssistantSpeaking(false);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = locale === 'or' ? 'or-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
      };

      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        setInput(transcript);

        // If speech recognition detected final result
        if (e.results[0] && e.results[0].isFinal) {
          setIsListening(false);
          if (transcript.trim()) {
            handleSendRef.current?.(transcript.trim(), true);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice recognition notice:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setIsListening(false);
    }
  }, [locale]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeech();
    setIsAssistantSpeaking(false);
  };

  const copyMessageText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const resetChat = () => {
    stopSpeech();
    setIsAssistantSpeaking(false);
    setMessages([]);
    setInput('');
  };

  const handleSend = async (questionText?: string, fromVoice: boolean = false) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isSending) return;

    if (isListening) {
      stopListening();
    }
    stopSpeech();
    setIsAssistantSpeaking(false);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setVoiceTranscript('');
    setIsSending(true);

    const shouldAutoSpeak = fromVoice || voiceMode;

    // Fast local path if navigator is offline:
    if (isOffline) {
      const kb = await getKnowledgeBase(locale);
      const matched = matchKnowledgeBase(textToSend, kb, surface.toUpperCase(), surface, locale);

      setTimeout(() => {
        const answerText = matched.entry
          ? matched.entry.answer
          : locale === 'or'
          ? 'ଅଫଲାଇନ୍ ମୋଡ୍ ରେ ଏହି ପ୍ରଶ୍ନର ଉତ୍ତର ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ରସିଦ ଦେଖନ୍ତୁ ବା ନେଟୱର୍କ ଆସିବା ପରେ ପଚାରନ୍ତୁ।'
          : 'I do not have an offline answer for this query. Please consult your latest receipt or ask when online.';

        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: answerText,
          citations: matched.entry ? [matched.entry.sourceRef] : ['/about'],
          offline: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsSending(false);

        if (shouldAutoSpeak) {
          speakAloud(
            answerText,
            locale === 'or' ? 'or-IN' : 'en-IN',
            () => setIsAssistantSpeaking(true),
            () => setIsAssistantSpeaking(false)
          );
        }
      }, 150);
      return;
    }

    // Online request with AbortController 4s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Primary endpoint selection:
    // If surface is public, store, or trade, prefer public endpoint
    const primaryEndpoint =
      surface === 'public' || surface === 'store' || surface === 'trade'
        ? '/api/public/assistant/chat'
        : '/api/assistant/chat';

    try {
      let res = await fetch(primaryEndpoint, {
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

      // Seamless fallback: if authenticated endpoint rejected with 401, retry via public endpoint
      if (!res.ok && res.status === 401 && primaryEndpoint !== '/api/public/assistant/chat') {
        res = await fetch('/api/public/assistant/chat', {
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
        });
      }

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

        // Auto-speak response in Voice Mode
        if (shouldAutoSpeak && data.answer) {
          speakAloud(
            data.answer,
            locale === 'or' ? 'or-IN' : 'en-IN',
            () => setIsAssistantSpeaking(true),
            () => setIsAssistantSpeaking(false)
          );
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      // Degrade gracefully to local offline matcher
      const kb = await getKnowledgeBase(locale);
      const matched = matchKnowledgeBase(textToSend, kb, surface.toUpperCase(), surface, locale);
      const fallbackText = matched.entry
        ? matched.entry.answer
        : locale === 'or'
        ? 'ମୈତ୍ରିୟମ୍ ସହାୟକ ଅଫଲାଇନ୍ ମୋଡ୍ ରେ ଚାଲୁଅଛି। ସରକାରୀ ଦର ତାଲିକା ପାଇଁ ଆପଣଙ୍କ ଡ୍ୟାସବୋର୍ଡ ଦେଖନ୍ତୁ।'
        : 'Maitriyam is temporarily running in offline mode. Please check the /about page or consult your local field supervisor.';

      const fallbackMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        citations: matched.entry ? [matched.entry.sourceRef] : ['/about'],
        offline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);

      if (shouldAutoSpeak) {
        speakAloud(
          fallbackText,
          locale === 'or' ? 'or-IN' : 'en-IN',
          () => setIsAssistantSpeaking(true),
          () => setIsAssistantSpeaking(false)
        );
      }
    } finally {
      setIsSending(false);
    }
  };
  handleSendRef.current = handleSend;

  if (isHidden || !enabled) return null;

  return (
    <>
      {/* Backdrop scrim on mobile when modal is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9998] sm:hidden animate-in fade-in duration-150 print:hidden no-print"
          onClick={() => {
            stopSpeech();
            setIsAssistantSpeaking(false);
            setIsOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Floating Launcher Button (visible when modal is closed) */}
      {!isOpen && (
        <div id="maitriyam-launcher" data-maitriyam-root className="fixed bottom-4 right-4 z-[9999] print:hidden no-print font-sans">
          <div className="flex items-center gap-1.5 shadow-xl rounded-full bg-[#25351F] border border-[#2D4F1E]/50 p-1.5 backdrop-blur-sm">
            {/* Quick Voice Launch Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setVoiceMode(true);
                  setTimeout(() => startListening(), 250);
                }}
                className="h-11 w-11 rounded-full bg-[#E27D60] hover:bg-[#d0684c] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                title={locale === 'or' ? 'ଭଏସ୍ ସହାୟକ ଆରମ୍ଭ କରନ୍ତୁ' : 'Start Voice Assistant'}
                aria-label="Start Voice Assistant"
              >
                <Mic size={18} />
              </button>
            )}

            {/* Text/Chat Modal Open Button */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="h-11 px-4 rounded-full text-[#FFFAF2] hover:bg-[#2D4F1E] transition-all flex items-center gap-2.5 focus:outline-2 focus:outline-accent active:scale-95 group select-none"
              aria-label="Open Maitriyam Guidance Assistant"
            >
              <MessageSquare size={18} className="text-[#E27D60] group-hover:scale-110 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-sans font-bold tracking-normal leading-tight">
                  {locale === 'or' ? 'ମୈତ୍ରିୟମ୍' : 'Maitriyam Assistant'}
                </span>
                <span className="text-[10px] text-[#F5E6CC]/70 font-sans leading-none hidden sm:inline">
                  {locale === 'or' ? 'ସହାୟତା ଓ ଦର' : 'MSP & Guidance'}
                </span>
              </div>
              {isOffline && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Running in offline mode" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Maitriyam In-App Assistant"
          data-maitriyam-modal
          className="fixed inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[580px] sm:max-h-[85vh] z-[9999] bg-surface border border-rule rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans print:hidden no-print"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#25351F] text-white flex items-center justify-between border-b border-[#2D4F1E] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E27D60]/20 flex items-center justify-center border border-[#E27D60]/30 shrink-0">
                <ShieldCheck size={18} className="text-[#E27D60]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-sans font-bold tracking-tight text-[#FFFAF2]">
                    Maitriyam · ମୈତ୍ରିୟମ୍
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-white/15 text-white/90">
                    Voice &amp; Text
                  </span>
                </div>
                <span className="text-[10px] text-[#F5E6CC]/70 block leading-none mt-0.5 font-sans">
                  Automated Guidance Assistant · Non-Affiliated
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Mode Toggle Button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceMode;
                    setVoiceMode(next);
                    if (next) {
                      startListening();
                    } else {
                      stopListening();
                      stopSpeech();
                      setIsAssistantSpeaking(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-sans font-semibold transition-all flex items-center gap-1.5 ${
                    voiceMode
                      ? 'bg-[#E27D60] text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white/90'
                  }`}
                  title="Toggle Hands-Free Voice Mode"
                  aria-label="Toggle Voice Mode"
                >
                  <Radio size={12} className={voiceMode ? 'animate-pulse' : ''} />
                  <span>{voiceMode ? 'Voice ON' : 'Voice'}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'or' : 'en')}
                className="px-2.5 py-1 rounded-[4px] text-[11px] font-sans font-bold bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
                title="Switch Language (English / ଓଡ଼ିଆ)"
              >
                <Languages size={12} />
                <span>{locale === 'en' ? 'ଓଡ଼ିଆ' : 'EN'}</span>
              </button>

              {/* Reset Chat Button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="p-1.5 rounded-[4px] hover:bg-white/15 transition-colors text-white/80 hover:text-white"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw size={15} />
                </button>
              )}

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setIsAssistantSpeaking(false);
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-[4px] hover:bg-white/15 transition-colors text-white"
                aria-label="Close assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Voice Assistant Banner (when speaking or listening) */}
          {isAssistantSpeaking && (
            <div className="px-3.5 py-1.5 bg-forest/10 border-b border-forest/20 text-forest text-[11px] flex items-center justify-between animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-forest rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-forest rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-2 bg-forest rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
                <span className="font-semibold text-ink">
                  {locale === 'or' ? 'ମୈତ୍ରିୟମ୍ ଉତ୍ତର ପଢୁଛନ୍ତି...' : 'Maitriyam is reading aloud...'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="px-2 py-0.5 rounded bg-surface border border-rule hover:bg-bg text-[10px] font-semibold text-ink flex items-center gap-1"
              >
                <VolumeX size={11} />
                <span>{locale === 'or' ? 'ବନ୍ଦ କରନ୍ତୁ' : 'Stop Audio'}</span>
              </button>
            </div>
          )}

          {/* Active Voice Listening Studio Bar */}
          {isListening && (
            <div className="px-3.5 py-2 bg-terracotta/10 border-b border-terracotta/30 text-terracotta text-xs flex items-center justify-between animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-terracotta" />
                </span>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Mic size={14} className="animate-bounce" />
                    <span>
                      {locale === 'or' ? 'ଶୁଣୁଛି... ଆପଣଙ୍କ ପ୍ରଶ୍ନ କୁହନ୍ତୁ' : 'Listening... Speak your question now'}
                    </span>
                  </div>
                  {voiceTranscript && (
                    <div className="text-[11px] text-ink italic mt-0.5 font-sans">
                      &ldquo;{voiceTranscript}&rdquo;
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="px-2 py-0.5 rounded bg-terracotta text-white text-[10px] font-semibold hover:bg-terracotta/90 transition-colors"
              >
                {locale === 'or' ? 'ସମାପ୍ତ' : 'Done'}
              </button>
            </div>
          )}

          {/* Odia Review Status Banner */}
          {locale === 'or' && !isListening && !isAssistantSpeaking && (
            <div className="bg-warning/10 border-b border-warning/30 px-3 py-1 flex items-center gap-1.5 text-[10px] text-warning font-medium shrink-0">
              <AlertCircle size={12} className="shrink-0" />
              <span>ଓଡ଼ିଆ ଅନୁବାଦ ମାନବୀୟ ଯାଞ୍ଚ ଅପେକ୍ଷାରେ ଅଛି (Pending Human Review).</span>
            </div>
          )}

          {/* Conversation Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-bg">
            {messages.length === 0 && (
              <div className="text-center py-3 px-2 space-y-3">
                <div className="w-11 h-11 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center shadow-xs">
                  <Sparkles size={22} className="text-forest" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    {locale === 'or' ? 'ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?' : 'How can I assist you today?'}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    {locale === 'or'
                      ? '୧୭ ବନଜାତ ଦ୍ରବ୍ୟର ସରକାରୀ ଦର, ଓଜନ, QR ଯାଞ୍ଚ ଏବଂ B2B ହୋଲସେଲ ବିଷୟରେ ପଚାରନ୍ତୁ ବା ମାଇକ୍ ଦବାଇ କୁହନ୍ତୁ।'
                      : 'Ask about MSP rates for all 17 MFP, certified weighment, QR provenance, or B2B wholesale. Speak aloud or type.'}
                  </p>
                </div>

                {/* Quick Topic Tiles Grid */}
                <div className="grid grid-cols-2 gap-2 text-left pt-1">
                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'ଆଜିର ମହୁଆ ଦର କେତେ?' : 'What are today rates?')}
                    className="p-2.5 rounded-[6px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group shadow-xs"
                  >
                    <span className="text-[11px] font-bold text-ink group-hover:text-forest block">
                      💰 {locale === 'or' ? 'ଦର ଓ MSP' : 'Rates & MSP'}
                    </span>
                    <span className="text-[10px] text-ink-muted block leading-tight">
                      {locale === 'or' ? 'ମହୁଲ, ଶାଳ, ମହୁ ଓ ଚାରୋଳି ଦର' : 'Mahua, Sal, Honey & Chironji'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(locale === 'or' ? 'କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?' : 'How does QR verification work?')}
                    className="p-2.5 rounded-[6px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group shadow-xs"
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
                    className="p-2.5 rounded-[6px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group shadow-xs"
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
                    className="p-2.5 rounded-[6px] border border-rule hover:border-forest/60 bg-surface hover:bg-bg transition-colors space-y-0.5 text-left group shadow-xs"
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
                <div className="p-2.5 rounded-[5px] bg-surface border border-rule text-[10px] text-ink-muted text-left space-y-1">
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
                  className={`max-w-[88%] rounded-[6px] px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-forest text-white'
                      : 'bg-surface border border-rule text-ink shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Structured Assistant Cards */}
                  {m.cards && m.cards.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {m.cards.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded-[6px] bg-bg border border-rule space-y-2 text-ink shadow-xs"
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
                            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-rule/60 text-[10px]">
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
                    <div className="mt-2.5 pt-1.5 border-t border-rule/50 flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                      <div className="flex items-center gap-2">
                        {/* Audio Playback Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isAssistantSpeaking) {
                              handleStopSpeaking();
                            } else {
                              speakAloud(
                                m.text,
                                locale === 'or' ? 'or-IN' : 'en-IN',
                                () => setIsAssistantSpeaking(true),
                                () => setIsAssistantSpeaking(false)
                              );
                            }
                          }}
                          className="hover:text-accent flex items-center gap-1 transition-colors"
                          title="Listen to this answer"
                        >
                          <Volume2 size={12} className={isAssistantSpeaking ? 'text-forest animate-pulse' : ''} />
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
                    <div className="mt-1.5 flex flex-wrap gap-1">
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
          {suggestedQuestions.length > 0 && !isListening && (
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

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-surface border-t border-rule flex items-center gap-2 shrink-0"
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
                  ? locale === 'or' ? 'ଶୁଣୁଛି...' : 'Listening to your voice...'
                  : locale === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ ବା ମାଇକ୍ ଦବାନ୍ତୁ...' : 'Ask a question or tap mic...'
              }
              className="flex-1 px-3 py-1.5 rounded-[4px] border border-rule bg-bg text-xs text-ink focus:outline-2 focus:outline-accent"
              maxLength={500}
            />

            {/* Voice Microphone Input Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isSending}
                aria-label={isListening ? 'Stop listening' : 'Start voice speech input'}
                title={
                  isListening
                    ? 'Stop listening'
                    : 'Speak question aloud (Auto-submits)'
                }
                className={`h-9 w-9 rounded-[4px] flex items-center justify-center transition-all shrink-0 ${
                  isListening
                    ? 'bg-terracotta text-white animate-pulse shadow-md ring-2 ring-terracotta/40'
                    : 'border border-rule hover:border-forest/60 bg-bg text-ink-muted hover:text-forest'
                }`}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send query"
              className="h-9 px-3.5 rounded-[4px] bg-forest hover:bg-forest-hover disabled:opacity-40 text-white text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>Send</span>
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
