import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Layers, Activity, Eye, Zap, Info } from 'lucide-react';

export default function ForecastChart({ forecast }) {
  const [metric, setMetric] = useState('aqi');
  const [mode, setMode] = useState('compare'); // 'coupled', 'uncoupled', 'compare'
  const [showConfidence, setShowConfidence] = useState(true);
  const [timeWindow, setTimeWindow] = useState(72); // 24, 48, 72

  if (!forecast || !forecast.hourly_coupled) return null;

  const coupled = forecast.hourly_coupled.slice(0, timeWindow);
  const uncoupled = forecast.hourly_uncoupled.slice(0, timeWindow);

  // Combine datasets for chart with safe string parsing
  const chartData = coupled.map((c, i) => {
    const u = uncoupled[i] || {};
    const rawTime = c.time || '';
    const hourPart = rawTime.includes(' ') ? rawTime.split(' ')[1] : (rawTime.length >= 16 ? rawTime.slice(11, 16) : `H${i}`);
    const datePart = rawTime.includes(' ') ? rawTime.split(' ')[0].slice(5) : '';
    const shortLabel = `${hourPart}${i % 6 === 0 && datePart ? ` (${datePart})` : ''}`;

    return {
      index: i,
      rawTime: rawTime,
      displayTime: shortLabel,
      coupled_aqi: c.aqi,
      uncoupled_aqi: u.aqi || c.aqi,
      aqi_min: c.aqi_min,
      aqi_max: c.aqi_max,
      coupled_pm25: c.pm25,
      uncoupled_pm25: u.pm25 || c.pm25,
      coupled_pm10: c.pm10,
      uncoupled_pm10: u.pm10 || c.pm10,
      coupled_no2: c.no2,
      uncoupled_no2: u.no2 || c.no2,
      coupled_o3: c.o3,
      uncoupled_o3: u.o3 || c.o3,
      coupled_pbl: c.pbl_height_m,
      uncoupled_pbl: u.pbl_height_m || c.pbl_height_m,
      inversion_strength: c.inversion_strength_c,
      trapping_risk: c.trapping_risk,
      feedback_impact: c.feedback_impact_pct,
    };
  });

  const getMetricKey = () => {
    switch (metric) {
      case 'pm25': return { c: 'coupled_pm25', u: 'uncoupled_pm25', unit: 'µg/m³', name: 'PM2.5' };
      case 'pm10': return { c: 'coupled_pm10', u: 'uncoupled_pm10', unit: 'µg/m³', name: 'PM10' };
      case 'no2': return { c: 'coupled_no2', u: 'uncoupled_no2', unit: 'µg/m³', name: 'NO₂' };
      case 'o3': return { c: 'coupled_o3', u: 'uncoupled_o3', unit: 'µg/m³', name: 'Ozone' };
      case 'pbl': return { c: 'coupled_pbl', u: 'uncoupled_pbl', unit: 'm', name: 'PBL Height' };
      case 'aqi':
      default: return { c: 'coupled_aqi', u: 'uncoupled_aqi', unit: 'AQI', name: 'Air Quality Index' };
    }
  };

  const currentMetric = getMetricKey();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-2">
            {data.rawTime}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Coupled (Feedback ON):
              </span>
              <span className="font-bold">{data[currentMetric.c]} {currentMetric.unit}</span>
            </div>

            {(mode === 'uncoupled' || mode === 'compare') && (
              <div className="flex items-center justify-between gap-4 text-sky-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Uncoupled (Fixed Weather):
                </span>
                <span className="font-bold">{data[currentMetric.u]} {currentMetric.unit}</span>
              </div>
            )}

            {mode === 'compare' && metric !== 'pbl' && (
              <div className="flex items-center justify-between gap-4 text-purple-300 font-medium pt-1 border-t border-slate-800">
                <span>Feedback Delta:</span>
                <span className="font-bold">
                  +{(data[currentMetric.c] - data[currentMetric.u]).toFixed(1)} {currentMetric.unit} ({data.feedback_impact}%)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-slate-400 pt-1">
              <span>Boundary Layer / Inversion:</span>
              <span className="font-mono text-slate-300">
                PBL {data.coupled_pbl}m | ΔT {data.inversion_strength}°C
              </span>
            </div>
            
            {showConfidence && metric === 'aqi' && (
              <div className="text-[10px] text-purple-400/90 font-medium pt-1 border-t border-slate-800">
                95% Confidence Band: {data.aqi_min} – {data.aqi_max}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">
              72-Hour Atmospheric Chemistry Forecast
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Coupled WRF-Chem aerosol feedback simulates real-time surface cooling and nocturnal inversion trapping.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('compare')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'compare'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coupled vs Uncoupled
            </button>
            <button
              onClick={() => setMode('coupled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'coupled'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coupled Only
            </button>
            <button
              onClick={() => setMode('uncoupled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'uncoupled'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Uncoupled Only
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[24, 48, 72].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setTimeWindow(hrs)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                  timeWindow === hrs
                    ? 'bg-slate-700 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Selector Pills & Confidence Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'aqi', label: 'Overall AQI' },
            { id: 'pm25', label: 'PM 2.5' },
            { id: 'pm10', label: 'PM 10' },
            { id: 'no2', label: 'NO₂' },
            { id: 'o3', label: 'Ozone (O₃)' },
            { id: 'pbl', label: 'PBL Height (m)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border cursor-pointer ${
                metric === m.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {metric === 'aqi' && (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={showConfidence}
              onChange={(e) => setShowConfidence(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>Show Confidence Envelope</span>
          </label>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="coupledGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.floor(timeWindow / 8)}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Threshold Guides if AQI */}
            {metric === 'aqi' && (
              <>
                <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Poor (200)', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Very Poor (300)', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={400} stroke="#a855f7" strokeDasharray="3 3" label={{ value: 'Severe (400)', fill: '#a855f7', fontSize: 10 }} />
              </>
            )}

            {/* Confidence Envelope Lines */}
            {showConfidence && metric === 'aqi' && mode !== 'uncoupled' && (
              <>
                <Line
                  type="monotone"
                  dataKey="aqi_max"
                  name="95% Confidence Upper"
                  stroke="#c084fc"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aqi_min"
                  name="95% Confidence Lower"
                  stroke="#c084fc"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </>
            )}

            {/* Uncoupled Model Line */}
            {(mode === 'uncoupled' || mode === 'compare') && (
              <Line
                type="monotone"
                dataKey={currentMetric.u}
                name="Uncoupled (Fixed Weather)"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray={mode === 'compare' ? '4 4' : undefined}
                dot={false}
              />
            )}

            {/* Coupled Model Line & Area */}
            {(mode === 'coupled' || mode === 'compare') && (
              <Area
                type="monotone"
                dataKey={currentMetric.c}
                name="Coupled (Aerosol Feedback ON)"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#coupledGrad)"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer */}
      <div className="mt-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-200 font-semibold">Atmospheric Feedback Insight: </span>
          {forecast.feedback_summary?.scientific_rationale ||
            'Aerosol optical depth attenuates solar radiation, lowering surface temperature and suppressing boundary layer mixing height by ~25%.'}
        </div>
      </div>
    </div>
  );
}
