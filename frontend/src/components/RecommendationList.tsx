import React, { useState } from 'react';
import { CheckSquare, Square, ShieldAlert, Sparkles } from 'lucide-react';
import type { Recommendation } from '../services/api';

interface RecommendationListProps {
  recommendations: Recommendation[];
  disclaimer: string;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  disclaimer,
}) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  const toggleComplete = (idx: number) => {
    setCompletedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'IMMEDIATE':
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Actionable Safeguards</span>
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Next Steps & Safety Checklist</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </h3>
          </div>
          <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
            Controlled Catalog
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Agronomist-approved mitigation checklist to limit spore propagation and prevent systemic canopy loss:
        </p>

        {/* Action Items List */}
        <div className="space-y-2.5">
          {recommendations.map((item, idx) => {
            const isDone = !!completedItems[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleComplete(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isDone
                    ? 'bg-slate-100/70 border-slate-200 opacity-60'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-emerald-600 hover:text-emerald-700 flex-shrink-0 focus:outline-none"
                >
                  {isDone ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.action}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getPriorityStyle(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agronomic Disclaimer */}
      <div className="mt-5 pt-4 border-t border-slate-200 flex items-start gap-2.5 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-900 leading-relaxed">
          <strong className="font-semibold text-amber-950">Decision-Support Notice:</strong> {disclaimer}
        </p>
      </div>
    </div>
  );
};
