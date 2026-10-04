import React from 'react';
import { Wind, Thermometer, Droplets, AlertTriangle, ShieldCheck, Globe, MapPin } from 'lucide-react';

export default function CurrentAqiCard({ forecast }) {
  if (!forecast || !forecast.current) return null;

  const { current, city, state, country, calibration_type } = forecast;

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Good':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          bar: 'bg-emerald-500',
        };
      case 'Satisfactory':
        return {
          bg: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
          badge: 'bg-lime-500 text-slate-950',
          bar: 'bg-lime-500',
        };
      case 'Moderate':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          badge: 'bg-yellow-500 text-slate-950',
          bar: 'bg-yellow-500',
        };
      case 'Poor':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
          bar: 'bg-amber-500',
        };
      case 'Very Poor':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          badge: 'bg-red-500 text-white',
          bar: 'bg-red-500',
        };
      case 'Severe':
      default:
        return {
          bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
          badge: 'bg-purple-600 text-white',
          bar: 'bg-purple-600',
        };
    }
  };

  const style = getCategoryStyles(current.category);

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800 shadow-2xl">
      {/* Background glow based on AQI category */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: current.color || '#a855f7' }}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Live Forecast Cycle
            </span>
            <span className="text-xs text-slate-400">
              {current.time}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-1 flex items-baseline gap-2 flex-wrap">
            <span>{city}</span>
            {state && <span className="text-slate-400 font-normal text-xl">{state},</span>}
            <span className="text-emerald-400 font-medium text-lg">{country || 'India'}</span>
          </h1>

          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            {calibration_type}
          </p>
        </div>

        {/* AQI Badge */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Standard AQI</div>
            <div className="text-sm font-semibold text-slate-200">
              Dominant: <span className="text-emerald-400">{current.dominant}</span>
            </div>
          </div>
          <div
            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg"
            style={{ backgroundColor: current.color, color: current.category === 'Moderate' || current.category === 'Satisfactory' ? '#0f172a' : '#ffffff' }}
          >
            <span className="text-3xl leading-none">{current.aqi}</span>
            <span className="text-[10px] tracking-tight uppercase font-bold mt-1">
              {current.category}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium">PM 2.5</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {current.pm25} <span className="text-xs font-normal text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 60 µg/m³</div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium">PM 10</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {current.pm10} <span className="text-xs font-normal text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 100 µg/m³</div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium">Nitrogen Dioxide (NO₂)</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {current.no2} <span className="text-xs font-normal text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 80 µg/m³</div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium">Ozone (O₃)</div>
          <div className="text-xl font-bold text-slate-100 mt-1">
            {current.o3} <span className="text-xs font-normal text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 100 µg/m³</div>
        </div>
      </div>

      {/* Atmospheric & Meteorology Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-slate-400">Temp:</span>
            <span className="text-sm font-semibold text-slate-200">{current.temp_c}°C</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Humidity:</span>
            <span className="text-sm font-semibold text-slate-200">{current.humidity_pct}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-400">Wind:</span>
            <span className="text-sm font-semibold text-slate-200">{current.wind_speed_mps} m/s</span>
          </div>
        </div>

        {/* Feedback Impact Badge */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          Feedback Amplification: <strong>+{current.feedback_impact_pct}%</strong>
        </div>
      </div>

      {/* Health Advisory Box */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Health Advisory — {current.category} Air Quality
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {current.category === 'Severe' && 'Emergency protocol. Healthy people experience respiratory difficulty; elderly and children should strictly avoid stepping outdoors. Keep air purifiers operational.'}
            {current.category === 'Very Poor' && 'Respiratory illness likely on prolonged exposure. Avoid strenuous early morning outdoor cardio or walks. Sensitive groups must wear N95/FFP2 masks.'}
            {current.category === 'Poor' && 'Breathing discomfort to most individuals on prolonged exposure. Minimize outdoor exertion during early morning and late evening inversion windows.'}
            {current.category === 'Moderate' && 'Air quality is acceptable; however, individuals with lung disorders, heart disease, or asthma may experience slight throat irritation.'}
            {(current.category === 'Satisfactory' || current.category === 'Good') && 'Air quality is ideal for outdoor activities, sports, and natural ventilation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
