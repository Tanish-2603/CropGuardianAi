import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { History, TrendingUp } from 'lucide-react';

interface HistoryItem {
  id: string;
  date: string;
  risk_score: number;
  risk_level: string;
  cv_class: string;
  cv_confidence: number;
  visual_risk: number;
  weather_risk: number;
  field_risk: number;
}

interface HistoryChartProps {
  history: HistoryItem[];
  fieldName: string;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history, fieldName }) => {
  if (!history || history.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[260px]">
        <History className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-xs text-slate-600">No historical scans recorded for {fieldName} yet.</p>
        <p className="text-[11px] text-slate-400 mt-1">Upload a leaf scan to initiate tracking.</p>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    date: h.date.split(' ')[0].slice(5), // MM-DD
    fullDate: h.date,
    score: Math.round(h.risk_score),
    level: h.risk_level,
    cvClass: h.cv_class.replace('Tomato___', '').replace(/_/g, ' '),
    visual: Math.round(h.visual_risk),
    weather: Math.round(h.weather_risk),
    field: Math.round(h.field_risk),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-display font-bold text-slate-900 flex items-center justify-between gap-3">
            <span>{data.fullDate}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              data.level === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' : data.level === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {data.level} ({data.score}/100)
            </span>
          </p>
          <p className="text-slate-600 text-[11px] capitalize">Class: {data.cvClass}</p>
          <div className="pt-1.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-medium">
            <span>Visual: {data.visual}%</span>
            <span>Weather: {data.weather}%</span>
            <span>Field: {data.field}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Field Health Timeline</span>
          <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Risk Score Progression</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </h3>
        </div>
        <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
          {history.length} Scans Logged
        </span>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Monitors how microclimate fluctuations compound leaf health over successive field observations:
      </p>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Risk Threshold Reference Lines */}
            <ReferenceLine y={40} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'MODERATE (40)', fill: '#d97706', fontSize: 9, position: 'insideTopRight' }} />
            <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'HIGH (70)', fill: '#dc2626', fontSize: 9, position: 'insideTopRight' }} />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#059669"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreGradient)"
              dot={{ stroke: '#059669', strokeWidth: 2, r: 4, fill: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2, fill: '#10b981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
