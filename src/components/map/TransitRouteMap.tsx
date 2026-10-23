'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Warehouse, Truck, Info } from 'lucide-react';

export interface MapLocation {
  id: string;
  name: string;
  nameOdia: string;
  type: 'VILLAGE_COLLECTION' | 'BLOCK_AGGREGATION' | 'CENTRAL_DEPOT';
  block: string;
  x: number; // SVG coordinate 0-800
  y: number; // SVG coordinate 0-500
  lat: number;
  lng: number;
  storageCapacityKg: number;
  manager: string;
}

export const MAYURBHANJ_LOCATIONS: MapLocation[] = [
  {
    id: 'LOC-BRP-01',
    name: 'Baripada Central Depôt',
    nameOdia: 'ବାରିପଦା କେନ୍ଦ୍ରୀୟ ଡିପୋ',
    type: 'CENTRAL_DEPOT',
    block: 'Baripada Sadar',
    x: 640,
    y: 260,
    lat: 21.9346,
    lng: 86.7329,
    storageCapacityKg: 500000,
    manager: 'Siba Prasad Das (Depôt Manager)',
  },
  {
    id: 'LOC-KRN-01',
    name: 'Karanjia Aggregation Center',
    nameOdia: 'କରଞ୍ଜିଆ ସଂଗ୍ରହ କେନ୍ଦ୍ର',
    type: 'BLOCK_AGGREGATION',
    block: 'Karanjia',
    x: 220,
    y: 310,
    lat: 21.7828,
    lng: 85.9723,
    storageCapacityKg: 80000,
    manager: 'A. Mohanty (Collection Manager)',
  },
  {
    id: 'LOC-JAS-02',
    name: 'Jashipur Collection Center',
    nameOdia: 'ଯଶୀପୁର ସଂଗ୍ରହ କେନ୍ଦ୍ର',
    type: 'BLOCK_AGGREGATION',
    block: 'Jashipur',
    x: 280,
    y: 190,
    lat: 21.9682,
    lng: 86.0827,
    storageCapacityKg: 65000,
    manager: 'R. K. Behera (Collection Manager)',
  },
  {
    id: 'LOC-RRP-03',
    name: 'Rairangpur Sub-depôt',
    nameOdia: 'ରାଇରଙ୍ଗପୁର ଉପ-ଡିପୋ',
    type: 'BLOCK_AGGREGATION',
    block: 'Rairangpur',
    x: 420,
    y: 110,
    lat: 22.2687,
    lng: 86.1772,
    storageCapacityKg: 95000,
    manager: 'P. Murmu (Sub-depôt Manager)',
  },
  {
    id: 'LOC-BDG-V1',
    name: 'Badagaon SHG Collection Point',
    nameOdia: 'ବଡ଼ଗାଁ ମହିଳା ସ୍ୱୟଂ ସହାୟକ ଗୋଷ୍ଠୀ',
    type: 'VILLAGE_COLLECTION',
    block: 'Karanjia',
    x: 160,
    y: 340,
    lat: 21.7251,
    lng: 85.9124,
    storageCapacityKg: 15000,
    manager: 'Sumitra Marndi (Facilitator)',
  },
  {
    id: 'LOC-KDM-V2',
    name: 'Kadamdiha Village Point',
    nameOdia: 'କଦମଡିହା ସଂଗ୍ରହ ବିନ୍ଦୁ',
    type: 'VILLAGE_COLLECTION',
    block: 'Karanjia',
    x: 250,
    y: 370,
    lat: 21.7512,
    lng: 86.0125,
    storageCapacityKg: 10000,
    manager: 'Champa Majhi (Facilitator)',
  },
];

export interface TransitRouteMapProps {
  activeBatchCode?: string;
  activeOrigin?: string;
  activeDestination?: string;
  className?: string;
}

export const TransitRouteMap: React.FC<TransitRouteMapProps> = ({
  activeBatchCode = '#BS-402',
  activeOrigin = 'Karanjia',
  activeDestination = 'Baripada',
  className = '',
}) => {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation>(MAYURBHANJ_LOCATIONS[0]);

  return (
    <div className={`border border-rule rounded-[4px] bg-surface overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-rule flex items-center justify-between bg-bg-sunken">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-accent" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-ink font-mono">
            Mayurbhanj District MFP Transit Topology
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" /> Central Depôt
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-sidebar-bg" /> Aggregation Center
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-warning" /> Village Point
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative p-2 bg-[#F6F0E4]">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Similipal Biosphere Reserve Natural Boundary Area */}
          <path
            d="M 330 180 Q 400 140 480 180 T 540 300 T 420 380 T 320 320 Z"
            fill="#E5EDE0"
            stroke="#BDD3B8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x="420"
            y="260"
            fill="#5E7857"
            fontSize="12"
            fontFamily="monospace"
            textAnchor="middle"
            letterSpacing="2"
          >
            SIMILIPAL BIOSPHERE RESERVE
          </text>
          <text
            x="420"
            y="278"
            fill="#7C9975"
            fontSize="10"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            Protected Core Watershed (Zero Transit Surcharge Zone)
          </text>

          {/* Highway Arteries */}
          {/* NH-49: Karanjia -> Jashipur -> Bangriposi -> Baripada */}
          <path
            d="M 160 340 L 220 310 L 280 190 L 460 160 L 640 260"
            fill="none"
            stroke="#9E8D77"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Feeder route: Kadamdiha -> Karanjia */}
          <path
            d="M 250 370 L 220 310"
            fill="none"
            stroke="#B5A48F"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          {/* Northern route: Jashipur -> Rairangpur */}
          <path
            d="M 280 190 L 420 110"
            fill="none"
            stroke="#9E8D77"
            strokeWidth="2"
          />

          {/* Active Batch Transit Corridor Glow (#BS-402) */}
          <path
            d="M 220 310 L 280 190 L 460 160 L 640 260"
            fill="none"
            stroke="#C05638"
            strokeWidth="3.5"
            strokeDasharray="6 4"
          />

          {/* Distance & Transit Mileposts */}
          <rect x="235" y="245" width="70" height="18" fill="#FAF6EE" stroke="#1F1A14" strokeWidth="1" rx="2" />
          <text x="270" y="258" fontSize="10" fontFamily="monospace" textAnchor="middle" fill="#1F1A14">
            34 km
          </text>

          <rect x="495" y="195" width="80" height="18" fill="#FAF6EE" stroke="#1F1A14" strokeWidth="1" rx="2" />
          <text x="535" y="208" fontSize="10" fontFamily="monospace" textAnchor="middle" fill="#1F1A14">
            98 km (NH-49)
          </text>

          {/* Moving Transit Truck Marker */}
          <g transform="translate(460, 160)">
            <circle cx="0" cy="0" r="14" fill="#C05638" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M-6 -4 L0 -4 L4 0 L4 4 L-6 4 Z" fill="#FFFFFF" />
            <circle cx="-3" cy="5" r="1.5" fill="#FFFFFF" />
            <circle cx="2" cy="5" r="1.5" fill="#FFFFFF" />
          </g>
          <text
            x="460"
            y="140"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            fill="#C05638"
          >
            Truck OD-11-AB-1234 ({activeBatchCode})
          </text>

          {/* Location Nodes */}
          {MAYURBHANJ_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation.id === loc.id;
            const nodeFill =
              loc.type === 'CENTRAL_DEPOT'
                ? '#C05638'
                : loc.type === 'BLOCK_AGGREGATION'
                ? '#1F2A22'
                : '#A8641B';

            return (
              <g
                key={loc.id}
                transform={`translate(${loc.x}, ${loc.y})`}
                onClick={() => setSelectedLocation(loc)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                {isSelected && (
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#C05638" strokeWidth="1.5" strokeDasharray="3 3" />
                )}
                <circle cx="0" cy="0" r="9" fill={nodeFill} stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="#FFFFFF" />

                {/* Node Label */}
                <rect
                  x="-60"
                  y="12"
                  width="120"
                  height="16"
                  fill="#FAF6EE"
                  stroke="#E2D9C8"
                  strokeWidth="1"
                  rx="2"
                />
                <text
                  x="0"
                  y="23"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  fill="#1F1A14"
                >
                  {loc.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Location Inspector Dossier */}
      <div className="p-4 border-t border-rule bg-surface grid grid-cols-1 md:grid-cols-4 gap-4 text-ink">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
              {selectedLocation.type.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] font-mono text-ink-subtle">
              {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E
            </span>
          </div>
          <h4 className="text-[15px] font-bold font-heading text-ink mt-1">
            {selectedLocation.name}
          </h4>
          <p className="text-[12px] text-ink-muted font-odia">
            {selectedLocation.nameOdia} · {selectedLocation.block} Block
          </p>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-mono block">
            Storage Capacity
          </span>
          <div className="text-[18px] font-bold font-heading tabular-nums text-ink mt-0.5">
            {(selectedLocation.storageCapacityKg / 1000).toFixed(0)} MT
          </div>
          <span className="text-[11px] text-ink-subtle font-mono">
            {selectedLocation.storageCapacityKg.toLocaleString()} kg max
          </span>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-mono block">
            Custody Officer
          </span>
          <div className="text-[13px] font-medium text-ink mt-0.5">
            {selectedLocation.manager}
          </div>
          <span className="text-[11px] text-success font-mono flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Scale Seal Certified
          </span>
        </div>
      </div>
    </div>
  );
};
