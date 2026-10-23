'use client';

import React, { useState } from 'react';
import {
  ProductHandlingProfile,
  getProductGuidance,
  CAPABILITY_DEFINITIONS,
  GuidanceStatus,
  MoistureSensitivityLevel,
} from '../../lib/productGuidance';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Thermometer,
  Droplets,
  PackageCheck,
  Truck,
  Warehouse,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

export interface ProductGuidanceCardProps {
  productIdentifier: string;
  stage?: 'COLLECTION' | 'DISPATCH' | 'STORAGE' | 'ALL';
  showChecklist?: boolean;
  interactiveChecklist?: boolean;
  compact?: boolean;
  className?: string;
  measuredMoisturePercent?: number;
  measuredTareKg?: number;
  observedStorageLocation?: string;
}

export function ProductGuidanceCard({
  productIdentifier,
  stage = 'ALL',
  showChecklist = true,
  interactiveChecklist = false,
  compact = false,
  className,
  measuredMoisturePercent,
  measuredTareKg,
  observedStorageLocation,
}: ProductGuidanceCardProps) {
  const profile: ProductHandlingProfile = getProductGuidance(productIdentifier);
  const [activeTab, setActiveTab] = useState<'handling' | 'environment' | 'checklist'>('handling');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(!compact);

  const toggleCheck = (id: string) => {
    if (!interactiveChecklist) return;
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const relevantChecklist = profile.inspectionChecklist.filter(
    (item) => item.stage === 'ALL' || stage === 'ALL' || item.stage === stage
  );

  const getStatusBadge = (status: GuidanceStatus) => {
    switch (status) {
      case 'OFFICIAL_RECOMMENDED':
        return <StatusBadge variant="success">OFFICIAL GUIDANCE</StatusBadge>;
      case 'PROTOTYPE_BASELINE':
        return <StatusBadge variant="neutral">PROTOTYPE BASELINE</StatusBadge>;
      case 'LOCAL_VERIFICATION_REQUIRED':
      default:
        return <StatusBadge variant="warning">LOCAL VERIFICATION REQUIRED</StatusBadge>;
    }
  };

  const getMoistureBadge = (level: MoistureSensitivityLevel) => {
    switch (level) {
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-danger/10 text-danger border border-danger/30">HIGH SENSITIVITY</span>;
      case 'MODERATE':
        return <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-warning/10 text-warning border border-warning/30">MODERATE SENSITIVITY</span>;
      case 'LOW':
        return <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-success/10 text-success border border-success/30">RESILIENT</span>;
    }
  };

  return (
    <div
      className={cn(
        'border border-rule rounded-[4px] bg-surface overflow-hidden transition-all',
        profile.guidanceStatus === 'LOCAL_VERIFICATION_REQUIRED' && 'border-warning/60',
        className
      )}
      data-testid="product-guidance-card"
      data-product={profile.productSlug}
    >
      {/* Header bar */}
      <div className="p-3 bg-bg-sunken/40 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[2px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <PackageCheck size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-[14px] font-bold text-ink leading-tight">
                {profile.productName}
              </span>
              <span className="text-[12px] font-mono text-ink-muted">
                ({profile.productNameOdia})
              </span>
              {getMoistureBadge(profile.moistureSensitivity)}
            </div>
            <div className="text-[11px] font-mono text-ink-subtle italic">
              {profile.scientificName} · Season: {profile.primaryHarvestSeason}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {getStatusBadge(profile.guidanceStatus)}
          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-[2px] border border-rule hover:bg-surface text-ink-muted hover:text-ink text-[11px] flex items-center gap-1 font-mono"
              aria-label={isExpanded ? 'Collapse guidance' : 'Expand guidance'}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{isExpanded ? 'Hide' : 'Guidance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main guidance content */}
      {isExpanded && (
        <div className="p-3.5 space-y-4 text-[13px]">
          {/* Important Warnings alert box */}
          {profile.warnings.length > 0 && (
            <div className="border border-warning/40 bg-warning/5 rounded-[3px] p-2.5 flex items-start gap-2.5">
              <AlertTriangle size={16} strokeWidth={2} className="text-warning shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-[0.05em] font-bold text-warning block">
                  Mandatory Handling Warnings
                </span>
                <ul className="text-[12px] text-ink space-y-0.5 list-disc list-inside">
                  {profile.warnings.map((w, idx) => (
                    <li key={idx} className="leading-snug">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab Navigation for clean display */}
          <div className="flex border-b border-rule gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('handling')}
              className={cn(
                'px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-[1px] transition-colors',
                activeTab === 'handling'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              Collection & Packaging
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('environment')}
              className={cn(
                'px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-[1px] transition-colors',
                activeTab === 'environment'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              Transport & Environment
            </button>
            {showChecklist && relevantChecklist.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5',
                  activeTab === 'checklist'
                    ? 'border-accent text-accent font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                )}
              >
                <span>Inspection Checklist</span>
                <span className="px-1.5 py-0.2 rounded-full bg-accent/10 text-accent text-[10px] font-mono">
                  {relevantChecklist.length}
                </span>
              </button>
            )}
          </div>

          {/* TAB 1: Collection & Packaging */}
          {activeTab === 'handling' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Collection stage instructions */}
                <div className="border border-rule rounded-[3px] p-3 bg-bg-sunken/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink">
                    <CheckCircle2 size={13} className="text-accent" />
                    <span>Collection-Stage Instructions</span>
                  </div>
                  <ul className="space-y-1 text-[12px] text-ink leading-relaxed">
                    {profile.collectionHandling.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-accent font-mono text-[10px] mt-0.5">0{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Packaging & Protection specs */}
                <div className="border border-rule rounded-[3px] p-3 bg-bg-sunken/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink">
                    <PackageCheck size={13} className="text-accent" />
                    <span>Packaging & Protection</span>
                  </div>
                  <div className="border border-rule/60 rounded-[2px] p-2 bg-surface">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Standard Container:</span>
                    <span className="font-medium text-ink text-[12px]">{profile.standardPackaging}</span>
                    <span className="text-[11px] font-mono text-ink-subtle block mt-0.5">
                      Standard tare: {profile.typicalTareKgPerBag} kg/unit
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Storage Protection Rules:</span>
                    <ul className="text-[12px] text-ink space-y-1">
                      {profile.packagingProtection.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-1 text-[11.5px]">
                          <span className="text-ink-muted">·</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Distinction Box: Recommended Guidance vs Measured Conditions */}
              {(measuredMoisturePercent !== undefined || measuredTareKg !== undefined || observedStorageLocation) && (
                <div className="border border-accent/30 bg-accent/5 rounded-[3px] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider font-bold text-accent">
                    <span>Field Measurement vs Recommended Baseline</span>
                    <span className="text-[10px] font-normal lowercase bg-accent/15 px-1.5 py-0.2 rounded text-accent-ink">
                      measured intake
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    {measuredMoisturePercent !== undefined && (
                      <div className="border border-rule bg-surface p-1.5 rounded-[2px]">
                        <span className="text-[10px] text-ink-muted block font-mono">Moisture:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-heading font-bold text-[14px] text-ink">{measuredMoisturePercent}%</span>
                          <span className="text-[10px] text-ink-subtle">
                            / max {profile.verifiedMoistureMaxPercent ? `${profile.verifiedMoistureMaxPercent}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                    {measuredTareKg !== undefined && (
                      <div className="border border-rule bg-surface p-1.5 rounded-[2px]">
                        <span className="text-[10px] text-ink-muted block font-mono">Deducted Tare:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-heading font-bold text-[14px] text-ink">{measuredTareKg} kg</span>
                          <span className="text-[10px] text-ink-subtle">/ std {profile.typicalTareKgPerBag} kg</span>
                        </div>
                      </div>
                    )}
                    {observedStorageLocation && (
                      <div className="border border-rule bg-surface p-1.5 rounded-[2px]">
                        <span className="text-[10px] text-ink-muted block font-mono">Assigned Bay:</span>
                        <span className="font-medium text-ink text-[12px] truncate block">{observedStorageLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Transport & Environment */}
          {activeTab === 'environment' && (
            <div className="space-y-3">
              {/* Moisture & Temperature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Moisture Threshold */}
                <div className="border border-rule rounded-[3px] p-2.5 bg-bg-sunken/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-ink">
                    <Droplets size={13} className="text-accent" />
                    <span>Moisture Limit</span>
                  </div>
                  <div className="font-heading text-[18px] font-bold text-ink tabular-nums">
                    {profile.verifiedMoistureMaxPercent !== null ? (
                      <span>≤ {profile.verifiedMoistureMaxPercent}% max</span>
                    ) : (
                      <span className="text-[12px] text-warning font-sans font-medium">
                        Not configured — verify locally
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-subtle block leading-tight">
                    {profile.moistureNotes}
                  </span>
                </div>

                {/* Temperature Limit */}
                <div className="border border-rule rounded-[3px] p-2.5 bg-bg-sunken/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-ink">
                    <Thermometer size={13} className="text-accent" />
                    <span>Temperature Guidance</span>
                  </div>
                  <div className="font-heading text-[15px] font-bold text-ink tabular-nums">
                    {profile.temperatureLimit ? (
                      <span>
                        {profile.temperatureLimit.maxC ? `< ${profile.temperatureLimit.maxC}°C` : ''}
                        {profile.temperatureLimit.minC ? `> ${profile.temperatureLimit.minC}°C` : ''}
                      </span>
                    ) : (
                      <span className="text-[12px] text-ink-muted font-sans font-medium">
                        Not configured — ambient shade
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-subtle block leading-tight">
                    {profile.temperatureLimit?.notes || 'Protect from direct radiant solar exposure; verify locally.'}
                  </span>
                </div>

                {/* Storage Environment */}
                <div className="border border-rule rounded-[3px] p-2.5 bg-bg-sunken/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-ink">
                    <Warehouse size={13} className="text-accent" />
                    <span>Depôt Allocation</span>
                  </div>
                  <div className="font-medium text-[13px] text-ink">
                    {profile.recommendedDepotZone}
                  </div>
                  <span className="text-[11px] text-ink-subtle block leading-tight">
                    {profile.storageEnvironment}
                  </span>
                </div>
              </div>

              {/* Transit Precautions & Vehicle Requirements */}
              <div className="border border-rule rounded-[3px] p-3 bg-surface space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-ink">
                  <Truck size={13} className="text-accent" />
                  <span>Transit Precautions & Required Vehicle Capabilities</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {profile.requiredVehicleCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[11px] font-mono bg-bg-sunken border border-rule text-ink"
                      title={CAPABILITY_DEFINITIONS[cap]?.description}
                    >
                      <span>✓</span>
                      <span>{CAPABILITY_DEFINITIONS[cap]?.label || cap}</span>
                    </span>
                  ))}
                </div>
                <ul className="text-[12px] text-ink space-y-1">
                  {profile.transportPrecautions.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-ink-muted">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suitable Depot Storage Capabilities */}
              <div className="border border-rule rounded-[3px] p-3 bg-surface space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-ink">
                  <Warehouse size={13} className="text-accent" />
                  <span>Required Depôt Storage Infrastructure</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.suitableStorageCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[11px] font-mono bg-accent/5 border border-accent/30 text-accent font-medium"
                      title={CAPABILITY_DEFINITIONS[cap]?.description}
                    >
                      <span>✓</span>
                      <span>{CAPABILITY_DEFINITIONS[cap]?.label || cap}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pre-Intake Inspection Checklist */}
          {activeTab === 'checklist' && showChecklist && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <span>
                  {stage === 'COLLECTION'
                    ? 'Verify before accepting produce from tribal gatherer'
                    : stage === 'DISPATCH'
                    ? 'Verify before authorizing consignment departure'
                    : 'Verify before warehouse intake & ledger registration'}
                </span>
                {interactiveChecklist && (
                  <span className="text-accent font-medium">Click to check</span>
                )}
              </div>

              <div className="space-y-1.5">
                {relevantChecklist.map((item) => {
                  const isChecked = checkedItems[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        'p-2.5 rounded-[3px] border text-[12px] flex items-start gap-2.5 transition-colors',
                        interactiveChecklist && 'cursor-pointer hover:bg-bg-sunken/40',
                        isChecked
                          ? 'border-success/40 bg-success/5 text-ink'
                          : 'border-rule bg-surface text-ink'
                      )}
                    >
                      <div className="mt-0.5 shrink-0 text-accent">
                        {isChecked ? (
                          <CheckSquare size={16} className="text-success" />
                        ) : (
                          <Square size={16} className="text-ink-muted" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('font-medium leading-tight', isChecked && 'line-through text-ink-muted')}>
                            {item.label}
                          </span>
                          {item.mandatory && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-danger/10 text-danger border border-danger/30 uppercase">
                              Required
                            </span>
                          )}
                        </div>
                        {item.guidanceNote && (
                          <span className="text-[11px] text-ink-subtle block">
                            {item.guidanceNote}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Provenance Footer */}
          <div className="pt-2 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-ink-subtle">
            <div className="flex items-center gap-1">
              <FileText size={12} />
              <span>Reference: {profile.sourceReference}</span>
            </div>
            <span>Operational guideline · Illustrative baseline</span>
          </div>
        </div>
      )}
    </div>
  );
}
