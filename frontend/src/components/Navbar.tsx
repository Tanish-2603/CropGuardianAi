import React from 'react';
import { ShieldCheck, Plus, Sparkles, Sliders, CloudRain, Thermometer, Droplets } from 'lucide-react';
import type { FieldItem, WeatherData } from '../services/api';

interface NavbarProps {
  fields: FieldItem[];
  selectedField: FieldItem | null;
  onSelectField: (f: FieldItem) => void;
  weather: WeatherData | null;
  onOpenScan: () => void;
  onOpenSimulator: () => void;
  onOpenAddField: () => void;
  currentTab: 'dashboard' | 'simulator' | 'history';
  onSelectTab: (tab: 'dashboard' | 'simulator' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  fields,
  selectedField,
  onSelectField,
  weather,
  onOpenScan,
  onOpenAddField,
  currentTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white font-extrabold">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-tight text-slate-900">
                Crop<span className="text-emerald-600">Guardian</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI EARLY-WARNING
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Fusing leaf vision, live microclimate & field agronomy</p>
          </div>
        </div>

        {/* Live Weather Widget & Field Selector */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-100/90 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <span className="text-slate-500 font-medium">Field:</span>
            <select
              value={selectedField?.id || ''}
              onChange={(e) => {
                const found = fields.find(f => f.id === e.target.value);
                if (found) onSelectField(found);
              }}
              className="bg-transparent text-emerald-700 font-bold focus:outline-none cursor-pointer"
            >
              {fields.map(f => (
                <option key={f.id} value={f.id} className="bg-white text-slate-800">
                  {f.name} ({f.crop_stage})
                </option>
              ))}
            </select>
          </div>

          {weather ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>{weather.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>{weather.humidity}% RH</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                <span>{weather.precipitation} mm</span>
              </div>
            </div>
          ) : (
            <span className="text-slate-400">Querying Open-Meteo...</span>
          )}
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('simulator')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'simulator'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulator</span>
            </button>
            <button
              onClick={() => onSelectTab('history')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </button>
          </nav>

          {/* Quick Action Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scan Leaf</span>
          </button>

          <button
            onClick={onOpenAddField}
            title="Add New Field Profile"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
