import React from 'react';
import { Layers, ShieldAlert, ArrowUpRight, Gauge, HelpCircle } from 'lucide-react';

export default function InversionCard({ inversion, forecast }) {
  const current = forecast?.current || {};
  const data = inversion || current;

  const strength = data.inversion_strength_c ?? current.inversion_strength_c ?? 3.4;
  const pblHeight = data.pbl_height_m ?? current.pbl_height_m ?? 320;
  const invBase = data.inversion_base_m ?? current.inversion_base_m ?? 120;
  const ventIndex = data.ventilation_index_m2s ?? current.ventilation_index_m2s ?? 1120;
  const risk = data.trapping_risk ?? current.trapping_risk ?? 'High';

  const getRiskColor = (r) => {
    switch (r) {
      case 'Severe': return { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', text: 'text-purple-400', bar: 'bg-purple-500' };
      case 'High': return { badge: 'bg-red-500/20 text-red-300 border-red-500/40', text: 'text-red-400', bar: 'bg-red-500' };
      case 'Moderate': return { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', text: 'text-yellow-400', bar: 'bg-yellow-500' };
      case 'Low':
      default: return { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'text-emerald-400', bar: 'bg-emerald-500' };
    }
  };

  const riskStyle = getRiskColor(risk);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Boundary Layer & Inversion Tracker</h2>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskStyle.badge}`}>
            {risk} Trapping Risk
          </span>
        </div>

        {/* 4 Key Numerical Indicators */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Inversion Strength</div>
            <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
              +{strength} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-500">ΔT in lower 1500m</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">PBL Mixing Height</div>
            <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
              {pblHeight} <span className="text-xs font-normal text-slate-400">m agl</span>
            </div>
            <div className="text-[10px] text-slate-500">Normal daytime &gt; 1200m</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Inversion Base</div>
            <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
              {invBase} <span className="text-xs font-normal text-slate-400">m</span>
            </div>
            <div className="text-[10px] text-slate-500">Surface or elevated cap</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Ventilation Index</div>
            <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
              {ventIndex} <span className="text-xs font-normal text-slate-400">m²/s</span>
            </div>
            <div className="text-[10px] text-slate-500">PBLH × Wind speed</div>
          </div>
        </div>

        {/* Visual Atmospheric Sounding Column Diagram */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Atmospheric Vertical Column</span>
            <span className="text-indigo-400 font-normal">0 - 1500m agl</span>
          </div>

          {/* Diagram layers */}
          <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-800 flex flex-col">
            {/* Free Atmosphere */}
            <div className="h-1/3 bg-sky-950/40 flex items-center justify-between px-3 text-[11px] text-sky-400 border-b border-sky-900/30">
              <span>Free Troposphere (Clean Air Dispersion)</span>
              <span>&gt; 1200m</span>
            </div>

            {/* Inversion Lid (Warm Air Cap) */}
            <div className="h-1/3 bg-amber-500/20 border-y border-amber-500/40 flex items-center justify-between px-3 text-[11px] text-amber-300 font-semibold relative">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Thermal Inversion Lid (ΔT +{strength}°C)</span>
              </div>
              <span>~{pblHeight}m Cap</span>
            </div>

            {/* Ground Pollutant Layer (Cold trapped air) */}
            <div className="h-1/3 bg-purple-950/60 flex items-center justify-between px-3 text-[11px] text-purple-300 font-semibold">
              <span className="flex items-center gap-1">
                🌫️ Trapped Particulates (PM2.5 Stagnation)
              </span>
              <span>Ground Level (0m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physics Insight */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {risk === 'Severe' || risk === 'High'
            ? 'A strong temperature inversion acts as a rigid atmospheric ceiling. Surface pollutants cannot rise or disperse until midday solar heating breaks the thermal cap.'
            : 'Boundary layer ventilation is sufficient to promote turbulent dispersion of ground-level vehicular and industrial emissions.'}
        </p>
      </div>
    </div>
  );
}
