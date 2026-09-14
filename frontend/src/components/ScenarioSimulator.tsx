import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, TrendingUp, Droplets, CloudRain, Thermometer, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { SimulationResult } from '../services/api';

export const ScenarioSimulator: React.FC = () => {
  // Simulator State Sliders
  const [humidity, setHumidity] = useState<number>(88);
  const [rainMm, setRainMm] = useState<number>(16);
  const [tempC, setTempC] = useState<number>(24.5);
  const [baseVisualRisk, setBaseVisualRisk] = useState<number>(45);
  const [cropStage, setCropStage] = useState<string>('Flowering');
  const [drainage, setDrainage] = useState<string>('Moderate');

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Quick Preset Scenarios
  const applyPreset = (type: 'mild_dry' | 'killer_demo' | 'catastrophic_rain') => {
    if (type === 'mild_dry') {
      setHumidity(45);
      setRainMm(0);
      setTempC(22);
      setBaseVisualRisk(35);
      setCropStage('Vegetative');
      setDrainage('Good');
    } else if (type === 'killer_demo') {
      // The Hackathon Killer Demo: visually mild leaf (45), but rain & 88% humidity triggers HIGH risk
      setHumidity(88);
      setRainMm(16);
      setTempC(24.5);
      setBaseVisualRisk(45);
      setCropStage('Flowering');
      setDrainage('Moderate');
    } else if (type === 'catastrophic_rain') {
      setHumidity(96);
      setRainMm(35);
      setTempC(26);
      setBaseVisualRisk(60);
      setCropStage('Fruiting');
      setDrainage('Poor');
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const runSim = async () => {
      setLoading(true);
      try {
        const res = await api.simulateRisk({
          base_visual_risk: baseVisualRisk,
          temperature: tempC,
          humidity: humidity,
          rain_24h_mm: rainMm,
          rain_probability: Math.min(100, rainMm * 5 + 20),
          crop_stage: cropStage,
          drainage: drainage,
        });
        if (!isCancelled) {
          setSimResult(res);
        }
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timer = setTimeout(runSim, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [humidity, rainMm, tempC, baseVisualRisk, cropStage, drainage]);

  const isHigh = simResult?.risk_level === 'HIGH';
  const isMod = simResult?.risk_level === 'MODERATE';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Banner / Differentiator Statement */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>THE WINNING DIFFERENTIATOR &bull; 72-HOUR KILLER DEMO</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            What is likely to happen next, and what can I do now?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Unlike generic leaf-classification apps that stop at a static label, CropGuardian fuses early visual cues with impending weather conditions to forecast disease pressure before visible damage ruins the harvest.
          </p>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold mr-1">Demo Presets:</span>
            <button
              onClick={() => applyPreset('killer_demo')}
              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              <span>Killer Demo (Mild Leaf + Wet Weather)</span>
            </button>
            <button
              onClick={() => applyPreset('mild_dry')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Clear & Dry (Low Risk)
            </button>
            <button
              onClick={() => applyPreset('catastrophic_rain')}
              className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 text-xs font-semibold transition cursor-pointer"
            >
              Severe Inundation (High Alert)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column (Sliders) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-bold text-slate-900 text-base">Environmental Variables</h3>
            </div>
            {loading && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
          </div>

          {/* Slider 1: Relative Humidity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                Relative Humidity (% RH)
              </span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {humidity}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>30% (Dry)</span>
              <span>80% (Spore Threshold)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* Slider 2: Forecasted Rainfall */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-indigo-500" />
                Projected 24h Rainfall (mm)
              </span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {rainMm} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={rainMm}
              onChange={(e) => setRainMm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0mm (None)</span>
              <span>15mm (Heavy Showers)</span>
              <span>50mm (Torrential)</span>
            </div>
          </div>

          {/* Slider 3: Ambient Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-500" />
                Field Temperature (°C)
              </span>
              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {tempC}°C
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="40"
              step="0.5"
              value={tempC}
              onChange={(e) => setTempC(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>12°C (Cool)</span>
              <span>18-28°C (Optimal Fungal Zone)</span>
              <span>40°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Slider 4: Base Visual Leaf Risk */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Base Visual Leaf Evidence (CV Model)
              </span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {baseVisualRisk}/100
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              step="5"
              value={baseVisualRisk}
              onChange={(e) => setBaseVisualRisk(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>5 (Pristine Leaf)</span>
              <span>45 (Mild Early Spot)</span>
              <span>95 (Severe Blight)</span>
            </div>
          </div>

          {/* Selectors: Crop Stage & Drainage */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Crop Growth Stage</label>
              <select
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Flowering">Flowering (Dense)</option>
                <option value="Fruiting">Fruiting (High Risk)</option>
                <option value="Harvest">Harvest Ready</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Field Drainage</label>
              <select
                value={drainage}
                onChange={(e) => setDrainage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="Good">Good (Rapid runoff)</option>
                <option value="Moderate">Moderate</option>
                <option value="Poor">Poor (Standing water)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Live Simulation Output Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Risk Result Card */}
          <div className={`glass-card rounded-2xl p-6 border transition-all ${
            isHigh ? 'border-red-200 bg-red-50/70' : isMod ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-200 bg-emerald-50/70'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Simulation Output</span>
                <h3 className="font-display text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Projected 72h Disease Trajectory</span>
                  <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                    isHigh ? 'bg-red-100 text-red-800 border-red-200' : isMod ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {simResult?.risk_level || 'ANALYZING'}
                  </span>
                </h3>
              </div>

              {/* Big Score Display */}
              <div className="flex items-baseline gap-1 text-right">
                <span className="font-display text-5xl font-black text-slate-900">
                  {simResult ? Math.round(simResult.risk_score) : '--'}
                </span>
                <span className="text-sm font-semibold text-slate-500">/100</span>
              </div>
            </div>

            {/* Scenario Narrative Summary */}
            <p className="text-xs sm:text-sm text-slate-700 bg-white/90 p-3.5 rounded-xl border border-slate-200 leading-relaxed shadow-2xs">
              {simResult?.scenario_summary}
            </p>

            {/* Subscores Component Breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block mb-1">Visual Subscore (45%)</span>
                <span className="font-bold text-blue-600">{simResult ? Math.round(simResult.visual_subscore) : 0}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block mb-1">Weather Subscore (35%)</span>
                <span className="font-bold text-amber-600">{simResult ? Math.round(simResult.weather_subscore) : 0}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block mb-1">Field Agronomy (20%)</span>
                <span className="font-bold text-emerald-600">{simResult ? Math.round(simResult.field_subscore) : 0}%</span>
              </div>
            </div>
          </div>

          {/* 72h Timeline Progression Cards */}
          {simResult && simResult.outlook_72h && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-display font-bold text-sm text-slate-900 mb-3 flex items-center justify-between">
                <span>Forward Progression Outlook (4-Day Window)</span>
                <span className="text-xs text-slate-500 font-normal">Impact under persistent weather</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {simResult.outlook_72h.map((day) => {
                  const dayHigh = day.risk_level === 'HIGH';
                  const dayMod = day.risk_level === 'MODERATE';
                  return (
                    <div
                      key={day.day_label}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        dayHigh ? 'bg-red-50/80 border-red-200' : dayMod ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 block mb-1">{day.day_label}</span>
                      <span className="font-display text-2xl font-extrabold text-slate-900 block">
                        {Math.round(day.risk_score)}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block border ${
                        dayHigh ? 'bg-red-100 text-red-800 border-red-200' : dayMod ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {day.risk_level}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-2 line-clamp-1">
                        {day.condition_summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Immediate Actions in Scenario */}
          {simResult && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-display font-bold text-sm text-slate-900 mb-3">
                Recommended Actions for this Simulated Scenario:
              </h4>
              <ul className="space-y-2">
                {simResult.recommendations.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
