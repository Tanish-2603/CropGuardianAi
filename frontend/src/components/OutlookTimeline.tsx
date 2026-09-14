import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, CloudRain, Droplets, Thermometer } from 'lucide-react';
import type { OutlookItem } from '../services/api';

interface OutlookTimelineProps {
  outlook: OutlookItem[];
}

export const OutlookTimeline: React.FC<OutlookTimelineProps> = ({ outlook }) => {
  if (!outlook || outlook.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Early-Warning Horizon</span>
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>72-Hour Risk Outlook</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Forward-Looking
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Next 3 Days</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-5 leading-relaxed">
        Projected disease pressure trajectory based on live Open-Meteo precipitation and atmospheric humidity forecasts.
      </p>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {outlook.map((day, idx) => {
          const isHigh = day.risk_level === 'HIGH';
          const isMod = day.risk_level === 'MODERATE';

          const cardBorder = isHigh
            ? 'border-red-200 bg-red-50/70 hover:border-red-300'
            : isMod
            ? 'border-amber-200 bg-amber-50/70 hover:border-amber-300'
            : 'border-slate-200 bg-slate-50/80 hover:border-emerald-300';

          const badgeBg = isHigh
            ? 'bg-red-100 text-red-800 border-red-200'
            : isMod
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          // Trend vs previous day
          const prevScore = idx > 0 ? outlook[idx - 1].risk_score : day.risk_score;
          const diff = day.risk_score - prevScore;

          return (
            <div
              key={day.day_label}
              className={`rounded-xl p-4 border transition-all glass-card-hover ${cardBorder} flex flex-col justify-between`}
            >
              {/* Card Top */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-sm text-slate-900">{day.day_label}</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                  {day.risk_level}
                </span>
              </div>

              {/* Middle: Big Score & Trend */}
              <div className="my-2 flex items-baseline justify-between">
                <div>
                  <span className="font-display text-3xl font-black text-slate-900">{Math.round(day.risk_score)}</span>
                  <span className="text-xs text-slate-500 font-semibold">/100</span>
                </div>
                {idx > 0 && (
                  <div className="flex items-center text-xs font-semibold">
                    {diff > 2 ? (
                      <span className="flex items-center gap-0.5 text-red-600 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> +{Math.round(diff)}
                      </span>
                    ) : diff < -2 ? (
                      <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                        <TrendingDown className="w-3.5 h-3.5" /> {Math.round(diff)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Minus className="w-3.5 h-3.5" /> 0
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Condition Note */}
              <p className="text-[11px] font-medium text-slate-600 mb-3 line-clamp-1">
                {day.condition_summary}
              </p>

              {/* Weather Indicators */}
              <div className="pt-2.5 border-t border-slate-200/80 grid grid-cols-3 gap-1 text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-1" title="Forecasted Temperature">
                  <Thermometer className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>{day.temperature}°</span>
                </div>
                <div className="flex items-center gap-1" title="Relative Humidity">
                  <Droplets className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span>{Math.round(day.humidity)}%</span>
                </div>
                <div className="flex items-center gap-1" title="Total Rainfall">
                  <CloudRain className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  <span>{day.rain_mm}mm</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
