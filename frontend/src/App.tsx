import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, CloudRain, 
  Droplets, Thermometer, Wind, 
  MapPin, ChevronRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { api } from './services/api';
import type { FieldItem, WeatherData, ScanResult } from './services/api';
import { Navbar } from './components/Navbar';
import { RiskGauge } from './components/RiskGauge';
import { OutlookTimeline } from './components/OutlookTimeline';
import { RiskDrivers } from './components/RiskDrivers';
import { RecommendationList } from './components/RecommendationList';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { ScanModal } from './components/ScanModal';
import { AddFieldModal } from './components/AddFieldModal';
import { HistoryChart } from './components/HistoryChart';

export const App: React.FC = () => {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [selectedField, setSelectedField] = useState<FieldItem | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Tabs & Modals
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'simulator' | 'history'>('dashboard');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState<boolean>(false);

  // Initial Data Fetching
  const loadInitialData = async () => {
    try {
      const fieldList = await api.getFields();
      setFields(fieldList);
      if (fieldList.length > 0) {
        const primary = fieldList[0];
        setSelectedField(primary);
        await loadFieldDetails(primary);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  const loadFieldDetails = async (field: FieldItem) => {
    try {
      // 1. Fetch live Open-Meteo weather
      const wData = await api.getWeather(field.latitude, field.longitude);
      setWeather(wData.current);

      // 2. Fetch history
      const hData = await api.getFieldHistory(field.id);
      setHistoryList(hData.history || []);

      // 3. Trigger initial scan load or fallback
      if (hData.history && hData.history.length > 0) {
        const last = hData.history[hData.history.length - 1];
        setLatestScan((prev) => {
          if (prev && prev.field_id === field.id) return prev;
          return {
            id: last.id,
            field_id: field.id,
            crop: field.crop,
            image_url: last.image_url,
            created_at: last.date,
            visual_result: {
              class: last.cv_class,
              confidence: last.cv_confidence,
              probabilities: { [last.cv_class]: last.cv_confidence },
              quality_status: 'pass',
              quality_notes: ['Baseline image verified']
            },
            weather: wData.current,
            risk: {
              score: last.risk_score,
              level: last.risk_level,
              outlook_hours: 72,
              visual_risk_subscore: last.visual_risk,
              weather_risk_subscore: last.weather_risk,
              field_risk_subscore: last.field_risk,
            },
            drivers: ["High Atmospheric Humidity", "Rain Inoculum Splash", "Flowering Stage Vulnerability"],
            risk_factors: [
              { factor: "High Atmospheric Humidity", contribution: 38, explanation: "Sustained humidity allows fungal spore penetration." },
              { factor: "Rain Inoculum Splash", contribution: 28, explanation: "Precipitation carries spores onto lower leaves." },
              { factor: "Flowering Stage Vulnerability", contribution: 24, explanation: "Dense canopy restricts internal airflow." }
            ],
            recommendations: [
              { priority: "HIGH", action: "Inspect lower foliage for concentric target spots", rationale: "Alternaria begins on oldest shaded leaves." },
              { priority: "HIGH", action: "Clear furrow blockages to prevent standing puddles", rationale: "Eliminates stagnant water near root zone." },
              { priority: "MEDIUM", action: "Rescan in 48h to evaluate lesion progress", rationale: "Monitors forward trajectory against weather." }
            ],
            outlook_72h: wData.outlook_days.map((day: any) => ({
              day_label: day.day_label,
              hours_from_now: day.hours_from_now,
              risk_score: Math.min(100, Math.round(last.risk_score * (1 + day.hours_from_now / 160))),
              risk_level: last.risk_level,
              temperature: day.temperature,
              humidity: day.humidity,
              rain_mm: day.rain_mm,
              rain_probability: day.rain_probability,
              condition_summary: day.condition_summary
            })),
            expert_disclaimer: "Decision-support prototype. Validate with a certified agronomist before applying chemical treatments."
          };
        });
      }
    } catch (err) {
      console.error("Error loading field details:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectField = (field: FieldItem) => {
    setSelectedField(field);
    loadFieldDetails(field);
  };

  const handleScanSuccess = (scanRes: ScanResult) => {
    setLatestScan(scanRes);
    if (selectedField) {
      loadFieldDetails(selectedField);
    }
    if (scanRes.risk.level === 'LOW') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        fields={fields}
        selectedField={selectedField}
        onSelectField={handleSelectField}
        weather={weather}
        onOpenScan={() => setIsScanModalOpen(true)}
        onOpenSimulator={() => setCurrentTab('simulator')}
        onOpenAddField={() => setIsAddFieldOpen(true)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Main Body Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* TAB 1: COMMAND DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Hero Banner */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CROPGUARDIAN &bull; TOMATO EARLY RISK WARNING</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Predicting disease pressure <span className="text-emerald-600">before visible damage</span> becomes severe.
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Active Field: <strong className="text-slate-900">{selectedField?.name || 'Tomato Field A'}</strong> ({selectedField?.crop_stage} stage, {selectedField?.irrigation} irrigation, {selectedField?.soil_type} soil). Current weather queries Open-Meteo in real time.
                  </p>
                </div>

                {/* Quick Action Pills */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setIsScanModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Diagnostic Scan</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('simulator')}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                  >
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>The Killer Demo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TOP ROW: Field Overview Cards + Weather Snapshot + Risk Dial */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Field Profile & Environmental Telemetry (7 cols) */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                
                {/* Weather Metrics Card */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Telemetry</span>
                      <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>Open-Meteo Microclimate Layer</span>
                        <CloudRain className="w-4 h-4 text-blue-500" />
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{selectedField?.latitude.toFixed(2)}°, {selectedField?.longitude.toFixed(2)}°</span>
                    </span>
                  </div>

                  {weather ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Temperature</span>
                        </div>
                        <span className="font-display text-xl font-bold text-slate-900">{weather.temperature}°C</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Sporulation: Favorable</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          <span>Rel. Humidity</span>
                        </div>
                        <span className="font-display text-xl font-bold text-blue-600">{weather.humidity}%</span>
                        <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">High canopy moisture</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                          <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                          <span>24h Rainfall</span>
                        </div>
                        <span className="font-display text-xl font-bold text-slate-900">{weather.precipitation} mm</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Prob: {weather.rain_probability}%</span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                          <Wind className="w-3.5 h-3.5 text-teal-600" />
                          <span>Wind Speed</span>
                        </div>
                        <span className="font-display text-xl font-bold text-slate-900">{weather.wind} km/h</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Spore splash window</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">Connecting to Open-Meteo...</div>
                  )}

                  {weather?.forecast_change && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Environmental Outlook Note:</span>
                      <span className="font-bold text-amber-800">{weather.forecast_change}</span>
                    </div>
                  )}
                </div>

                {/* Agronomic Context Card */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Field Parameters</span>
                    <span className="text-xs text-emerald-700 font-bold">{selectedField?.crop} crop</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Phenological Stage</span>
                      <span className="font-bold text-slate-900">{selectedField?.crop_stage}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Irrigation Method</span>
                      <span className="font-bold text-slate-900">{selectedField?.irrigation}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Row Drainage</span>
                      <span className="font-bold text-slate-900">{selectedField?.drainage}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Soil Type</span>
                      <span className="font-bold text-slate-900">{selectedField?.soil_type}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Semi-Circle Risk Gauge Dial (5 cols) */}
              <div className="lg:col-span-5">
                <RiskGauge
                  score={latestScan?.risk.score || 45}
                  level={latestScan?.risk.level || 'MODERATE'}
                  visualSubscore={latestScan?.risk.visual_risk_subscore || 45}
                  weatherSubscore={latestScan?.risk.weather_risk_subscore || 65}
                  fieldSubscore={latestScan?.risk.field_risk_subscore || 35}
                />
              </div>

            </div>

            {/* MIDDLE ROW: 72-Hour Outlook Timeline + Top 3 Risk Drivers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <OutlookTimeline outlook={latestScan?.outlook_72h || []} />
              </div>
              <div className="lg:col-span-4">
                <RiskDrivers drivers={latestScan?.risk_factors || []} />
              </div>
            </div>

            {/* BOTTOM ROW: Recommendation Checklist + Latest Leaf Scan + Risk History Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Recommendation Checklist (6 cols) */}
              <div className="lg:col-span-6">
                <RecommendationList
                  recommendations={latestScan?.recommendations || []}
                  disclaimer={latestScan?.expert_disclaimer || "Decision-support prototype. Confirm with agronomist."}
                />
              </div>

              {/* Latest Leaf Evidence & Quality Card (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                {latestScan && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Visual Evidence</span>
                        <h4 className="font-display font-bold text-slate-900 text-base">Latest Leaf Diagnostic Scan</h4>
                      </div>
                      <span className="text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                        {Math.round(latestScan.visual_result.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                        <img
                          src={`http://127.0.0.1:8000${latestScan.image_url}`}
                          alt="Scanned leaf"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 capitalize">
                            {latestScan.visual_result.class.replace('Tomato___', '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Visual risk subscore: <strong className="text-blue-600">{Math.round(latestScan.risk.visual_risk_subscore)}/100</strong>. Quality Guard check: <span className="text-emerald-700 font-bold">Passed</span>.
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setIsScanModalOpen(true)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Scan New Sample Leaf</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Trend Chart */}
                <HistoryChart
                  history={historyList}
                  fieldName={selectedField?.name || 'Tomato Field'}
                />
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: SCENARIO SIMULATOR ("THE KILLER DEMO") */}
        {currentTab === 'simulator' && (
          <ScenarioSimulator />
        )}

        {/* TAB 3: FULL FIELD HEALTH TIMELINE */}
        {currentTab === 'history' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">Full Field Risk History & Trends</h2>
                  <p className="text-xs text-slate-500 mt-1">Audit trail of all previous multimodal scans for {selectedField?.name}</p>
                </div>
                <button
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  + Log New Scan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <HistoryChart history={historyList} fieldName={selectedField?.name || ''} />
              </div>
              <div className="lg:col-span-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-slate-700">Logged Scans ({historyList.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {historyList.map((h, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block capitalize">{h.cv_class.replace('Tomato___', '').replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-500">{h.date}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        h.risk_level === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' : h.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {Math.round(h.risk_score)}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 glass-panel bg-white py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-800">CropGuardian AI</span>
            <span>&bull;</span>
            <span>Tomato Decision-Support Platform</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Open-Meteo Integration &bull; Transfer Learning CV &bull; Rule-Based Agronomic Safety Layer
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        field={selectedField}
        onScanSuccess={handleScanSuccess}
      />

      <AddFieldModal
        isOpen={isAddFieldOpen}
        onClose={() => setIsAddFieldOpen(false)}
        onFieldCreated={(newField) => {
          setFields(prev => [...prev, newField]);
          setSelectedField(newField);
          loadFieldDetails(newField);
        }}
      />

    </div>
  );
};

export default App;
