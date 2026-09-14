import React from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon, Info } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  level: string;
  visualSubscore: number;
  weatherSubscore: number;
  fieldSubscore: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  visualSubscore,
  weatherSubscore,
  fieldSubscore,
}) => {
  // Score clamped between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Needle angle for semi-circle: 0 = -180deg (left), 50 = -90deg (top), 100 = 0deg (right)
  const rotationDegrees = -180 + (clampedScore / 100) * 180;

  // Level configuration
  const levelConfig = {
    LOW: {
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      label: 'LOW RISK',
      statusNote: 'Stable baseline conditions. No critical disease pressure detected.'
    },
    MODERATE: {
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      label: 'MODERATE RISK',
      statusNote: 'Early risk signals detected. Disease pressure active over next 48h.'
    },
    HIGH: {
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertOctagon,
      label: 'HIGH RISK',
      statusNote: 'Urgent early-warning. Favorable environment compounds visual lesion indicators.'
    }
  }[level] || {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
    label: 'NORMAL',
    statusNote: 'Monitoring field'
  };

  const IconComponent = levelConfig.icon;

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Multimodal Risk Fusion</span>
          <h3 className="font-display text-lg font-bold text-slate-900">Overall Crop Health Risk</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${levelConfig.bg} ${levelConfig.color} ${levelConfig.border}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{levelConfig.label}</span>
        </div>
      </div>

      {/* Semi-circular Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 200 115" className="w-64 h-36">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Colored Active Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeDasharray="251.32"
            strokeDashoffset={251.32 - (clampedScore / 100) * 251.32}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Center Hub */}
          <circle cx="100" cy="100" r="8" fill="#ffffff" stroke="#64748b" strokeWidth="3" />

          {/* Needle in Crisp Dark Slate */}
          <g transform={`rotate(${rotationDegrees} 100 100)`} className="transition-transform duration-1000 ease-out">
            <line x1="100" y1="100" x2="35" y2="100" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="30,100 45,96 45,104" fill="#0f172a" />
          </g>
        </svg>

        {/* Big Numeric Score Center Display */}
        <div className="absolute top-16 text-center">
          <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            {clampedScore}
          </span>
          <span className="text-sm font-semibold text-slate-500">/100</span>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Composite Risk Score</p>
        </div>
      </div>

      {/* Status Explainer */}
      <p className="text-xs text-slate-600 text-center px-4 mb-4 leading-relaxed">
        {levelConfig.statusNote}
      </p>

      {/* Subscores Component Breakdown Formula */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2 font-mono">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            0.45×Visual + 0.35×Weather + 0.20×Field
          </span>
          <span className="text-emerald-700 font-bold">FUSED</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block mb-1">Visual Leaf AI</span>
            <span className="font-bold text-slate-800">{Math.round(visualSubscore)}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, visualSubscore)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block mb-1">Weather Risk</span>
            <span className="font-bold text-slate-800">{Math.round(weatherSubscore)}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, weatherSubscore)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block mb-1">Field Agronomy</span>
            <span className="font-bold text-slate-800">{Math.round(fieldSubscore)}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, fieldSubscore)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
