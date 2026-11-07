'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Briefcase, ArrowRight, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';

interface StatItem {
  numericValue: number;
  suffix: string;
  prefix?: string;
  label: string;
  labelOdia: string;
  description: string;
}

const STATS: StatItem[] = [
  {
    numericValue: 1.4,
    suffix: 'M+',
    label: 'Primary Tribal Gatherers',
    labelOdia: 'ଆଦିବାସୀ ସଂଗ୍ରାହକ',
    description: 'Directly empowered across 26 blocks of Mayurbhanj',
  },
  {
    numericValue: 100,
    suffix: '%',
    label: 'Direct Benefit Transfer',
    labelOdia: 'ପ୍ରତ୍ୟକ୍ଷ ଲାଭ ହସ୍ତାନ୍ତର',
    description: 'Mandated statutory MSP credited without deductions',
  },
  {
    numericValue: 17,
    suffix: '',
    label: 'Certified MFP Botanicals',
    labelOdia: 'ପ୍ରମାଣିତ ବନଜାତ ଦ୍ରବ୍ୟ',
    description: 'Mahua, Sal, Chironji, Harida & wild cliff honey',
  },
  {
    numericValue: 0,
    prefix: '₹',
    suffix: '',
    label: 'Intermediary Cut',
    labelOdia: 'ଶୂନ୍ୟ ମଧ୍ୟସ୍ଥି କମିଶନ',
    description: '100% statutory value reaches the primary collector',
  },
];

export const LandingHero: React.FC = () => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCounts(STATS.map((s) => s.numericValue));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 1600; // ms
          const steps = 40;
          const intervalTime = duration / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep += 1;
            const progress = currentStep / steps;
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCounts(
              STATS.map((stat) => {
                const target = stat.numericValue;
                const value = target * easeOutQuart;
                return target < 10 ? Math.round(value * 10) / 10 : Math.round(value);
              })
            );

            if (currentStep >= steps) {
              clearInterval(timer);
              setCounts(STATS.map((s) => s.numericValue));
            }
          }, intervalTime);
        }
      },
      { threshold: 0.2 }
    );

    const currentElem = statsRef.current;
    if (currentElem) observer.observe(currentElem);

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [hasAnimated]);

  const handleScrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-canopy-deep text-warm-white pt-14 pb-16 sm:pt-24 sm:pb-24 lg:pt-28 lg:pb-32">
      {/* 1. LAYERED SAL FOREST CANOPY BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Layer 1: Optimized Photographic Image */}
        <Image
          src="/images/hero-sal-canopy.jpg"
          alt="Mayurbhanj Similipal dense Sal forest canopy"
          fill
          priority
          sizes="100vw"
          quality={80}
          className="object-cover object-center opacity-40 scale-105 motion-safe:animate-pulse-subtle"
        />

        {/* Layer 2: Deep Dark Canopy Scrim & Green Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(13, 23, 10, 0.76) 0%, rgba(21, 36, 16, 0.88) 55%, rgba(13, 23, 10, 0.98) 100%)',
          }}
        />

        {/* Layer 3: Atmospheric Mist (Pure CSS, Disabled on Reduced Motion) */}
        <div className="hidden sm:block absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. FOREGROUND HERO CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-sans font-semibold uppercase tracking-[0.14em] text-cream mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" aria-hidden="true" />
          <span>TDCCOL · LABHA SCHEME · MAYURBHANJ DISTRICT</span>
        </div>

        {/* Headline in Fraunces Variable Serif */}
        <h1 className="font-serif type-display-hero font-normal text-warm-white tracking-tight leading-[1.08] text-balance max-w-4xl mx-auto">
          From the forest <br className="hidden sm:inline" />
          <span className="italic font-normal text-terracotta">to the marketplace.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-5 type-body-lead text-cream/90 max-w-2xl mx-auto leading-relaxed font-sans text-balance">
          Direct Benefit Transfer for tribal gatherers, digital custody tracking, and verified B2B trade for minor
          forest produce.
        </p>

        {/* Primary Action Buttons (Accessible min 44x44px touch targets) */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 w-full sm:w-auto max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleScrollToSection('operations')}
            className="touch-target px-7 py-3.5 bg-forest text-warm-white text-sm font-sans font-semibold rounded-[6px] hover:bg-forest-hover transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.98] border border-forest/60 focus-visible:outline-2 focus-visible:outline-terracotta"
          >
            <Building2 size={16} className="text-terracotta" />
            <span>Explore Operations (B2G)</span>
            <ArrowRight size={14} />
          </button>
          <Link
            href="/trade"
            className="touch-target px-7 py-3.5 bg-white/10 text-warm-white border border-white/25 hover:bg-white/15 backdrop-blur-sm text-sm font-sans font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2.5 shadow-xs hover:shadow-sm active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-terracotta"
          >
            <Briefcase size={16} className="text-terracotta" />
            <span>Explore Marketplace (B2B)</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Statutory Guarantee Trust Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-sans font-medium text-cream/80 max-w-3xl">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-terracotta shrink-0" />
            <span>100% Minimum Support Price (MSP) DBT</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Similipal Biosphere Reserve Corridor</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>Zero Scale &amp; Intermediary Deductions</span>
          </div>
        </div>

        {/* 3. ANIMATED STAT COUNTERS */}
        <div
          ref={statsRef}
          className="mt-14 sm:mt-20 w-full max-w-5xl rounded-[12px] border border-white/15 bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-card"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {STATS.map((stat, idx) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center text-center ${
                  idx > 0 ? 'pt-4 sm:pt-0 sm:pl-6' : ''
                }`}
              >
                <div className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-warm-white">
                  {stat.prefix}
                  {counts[idx]}
                  {stat.suffix}
                </div>
                <div className="mt-2 text-xs font-sans font-semibold text-terracotta tracking-wide">
                  {stat.label}
                </div>
                <div className="font-odia text-[11px] text-cream/70 mt-0.5" lang="or">
                  {stat.labelOdia}
                </div>
                <p className="mt-1 text-[11px] sm:text-xs text-cream/70 leading-relaxed font-sans max-w-[180px]">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Cue Chevron */}
        <button
          type="button"
          onClick={() => handleScrollToSection('operations')}
          className="mt-10 sm:mt-12 text-cream/60 hover:text-cream transition-colors flex flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-terracotta rounded-full p-2 touch-target"
          aria-label="Scroll to Operations Section"
        >
          <span className="text-xs uppercase tracking-widest font-mono">Explore Platform</span>
          <ChevronDown size={18} className="animate-bounce" />
        </button>
      </div>
    </section>
  );
};
