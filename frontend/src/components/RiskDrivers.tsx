import React from 'react';
import { Zap, AlertCircle, Wind, Droplet, Sprout, Layers } from 'lucide-react';
import type { RiskFactor } from '../services/api';

interface RiskDriversProps {
  drivers: RiskFactor[];
}

export const RiskDrivers: React.FC<RiskDriversProps> = ({ drivers }) => {
  if (!drivers || drivers.length === 0) return null;

  const getDriverIcon = (factorName: string) => {
    const fn = factorName.toLowerCase();
    if (fn.includes('humidity') || fn.includes('moisture')) return Droplet;
    if (fn.includes('rain') || fn.includes('precipitation')) return Wind;
    if (fn.includes('stage') || fn.includes('flowering') || fn.includes('fruiting')) return Sprout;
    if (fn.includes('drainage') || fn.includes('soil')) return Layers;
    return AlertCircle;
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Explainable AI</span>
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Top Risk Drivers</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </h3>
          </div>
          <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
            Ranked by impact
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Why is the risk elevated? Factors multiplying disease propagation probability for this field:
        </p>

        {/* Driver Cards */}
        <div className="space-y-3">
          {drivers.slice(0, 3).map((d, index) => {
            const Icon = getDriverIcon(d.factor);
            return (
              <div
                key={index}
                className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">{d.factor}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    +{Math.round(d.contribution)} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                  {d.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
