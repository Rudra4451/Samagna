'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BusinessIndustry } from '@/lib/marketplace';
import {
  Building2,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceRegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'B2B' | 'B2C'>('B2B');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [industry, setIndustry] = useState<BusinessIndustry>('AYURVEDIC_MEDICINE');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
    setTimeout(() => {
      router.push(accountType === 'B2B' ? '/marketplace/b2b' : '/marketplace/b2c');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Back button */}
      <Link
        href="/marketplace"
        className="text-[12px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5"
      >
        <ArrowLeft size={14} />
        <span>Back to Marketplace</span>
      </Link>

      <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none">
        <div className="border-b border-rule pb-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
            Account Registration & Company Verification
          </span>
          <h1 className="text-[24px] font-heading font-bold text-ink">
            Register for Direct Forest Procurement
          </h1>
          <p className="text-[13px] text-ink-muted">
            Connect your enterprise or personal account to verified Similipal forest produce lots.
          </p>
        </div>

        {isRegistered ? (
          <div className="p-8 text-center space-y-4 bg-emerald-50 border border-emerald-200 rounded-[3px]">
            <CheckCircle2 size={42} className="mx-auto text-emerald-600" />
            <h2 className="text-[20px] font-heading font-bold text-emerald-900">
              Registration & Verification Successful!
            </h2>
            <p className="text-[13px] text-emerald-700 max-w-md mx-auto">
              Your {accountType === 'B2B' ? 'corporate entity' : 'customer account'} has been verified with the Baripada Central Procurement Desk. Redirecting to catalog...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-ink block">
                Select Account Classification:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('B2B')}
                  className={cn(
                    'p-3.5 rounded-[3px] border text-left transition-colors flex flex-col gap-1',
                    accountType === 'B2B'
                      ? 'border-accent bg-accent/10 text-accent font-bold'
                      : 'border-rule bg-surface text-ink-muted hover:border-ink-subtle'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[13px]">
                    <Building2 size={16} />
                    <span>Commercial B2B Buyer</span>
                  </div>
                  <span className="text-[11px] text-ink-muted font-normal">
                    Pharma, Ayurvedic, Food Processing, Wholesale Exporters
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('B2C')}
                  className={cn(
                    'p-3.5 rounded-[3px] border text-left transition-colors flex flex-col gap-1',
                    accountType === 'B2C'
                      ? 'border-accent bg-accent/10 text-accent font-bold'
                      : 'border-rule bg-surface text-ink-muted hover:border-ink-subtle'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[13px]">
                    <ShoppingBag size={16} />
                    <span>Individual Customer</span>
                  </div>
                  <span className="text-[11px] text-ink-muted font-normal">
                    Household consumer packs, honey jars & herbal supplies
                  </span>
                </button>
              </div>
            </div>

            {/* B2B Fields */}
            {accountType === 'B2B' && (
              <div className="space-y-4 pt-2 border-t border-rule">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    Company Registered Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Dabur India Ltd / Baidyanath Herbal"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">
                      Corporate GSTIN Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="20AAACB2222B1Z4"
                      className="w-full h-[38px] px-3 text-[13px] font-mono uppercase font-bold border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">
                      Company PAN Number
                    </label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="AAACB2222B"
                      className="w-full h-[38px] px-3 text-[13px] font-mono uppercase border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as BusinessIndustry)}
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink cursor-pointer"
                  >
                    <option value="AYURVEDIC_MEDICINE">Ayurvedic & Classical Herbal Formulations</option>
                    <option value="PHARMACEUTICAL">Standardized Pharmaceutical Extracts</option>
                    <option value="FOOD_PROCESSING">Food Processing & Natural Confectionery</option>
                    <option value="WHOLESALE_DISTRIBUTOR">Wholesale Botanical Commodity Distributor</option>
                    <option value="EXPORTER">International Forest Produce Exporter</option>
                    <option value="LARGE_SCALE_TRADER">Large-Scale Commodity Trader</option>
                  </select>
                </div>
              </div>
            )}

            {/* General Contact Info */}
            <div className="space-y-3 pt-2 border-t border-rule">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    {accountType === 'B2B' ? 'Authorized Procurement Officer *' : 'Your Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94370-XXXXX"
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Billing & Receiving Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Facility Address"
                  className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="751001"
                    className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[44px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
            >
              <span>Complete Verification & Register</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

