import React from 'react';
import { Flame, Compass, Clock, Wind, Radio, Info, CheckCircle2 } from 'lucide-react';

export default function PlumeCard({ plume, firesCount, city, country }) {
  const isSouthAsia =
    !country ||
    ['india', 'in', 'pakistan', 'bangladesh', 'nepal'].includes(country.toLowerCase());

  const metrics = plume?.plume_metrics || {
    upwind_active_fires: 84,
    total_upwind_frp_mw: 6420.5,
    smoke_contribution_pct: 32.4,
    mean_wind_vector: {
      origin: 'North-West (315°)',
      speed_kmh: 14.5,
      direction_deg: 315.0,
    },
    transport_time_hours: 12.4,
    advisory: 'Agricultural stubble burning contributes smoke via North-Westerly transport corridors.',
  };

  const contribution = isSouthAsia ? metrics.smoke_contribution_pct : 0.0;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${isSouthAsia ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-lg font-bold text-slate-100">Regional Smoke & Plume Attribution</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-orange-400 animate-ping" />
            NASA FIRMS VIIRS/MODIS
          </span>
        </div>

        {/* Attribution Hero Card */}
        <div
          className={`my-5 p-4 rounded-2xl border flex items-center justify-between ${
            isSouthAsia
              ? 'bg-gradient-to-br from-orange-950/40 via-slate-900/80 to-slate-900/90 border-orange-500/30'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div>
            <div className="text-xs text-slate-400 font-medium">
              Agricultural Stubble Smoke Contribution
            </div>
            <div className={`text-2xl md:text-3xl font-black mt-0.5 ${isSouthAsia ? 'text-orange-400' : 'text-emerald-400'}`}>
              {isSouthAsia ? `${contribution}%` : '0.0%'}{' '}
              <span className="text-xs font-normal text-slate-400">of city PM2.5</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Target: <span className="text-slate-200 font-semibold">{city}</span> ({country || 'India'})
            </div>
          </div>

          <div
            className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center ${
              isSouthAsia
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isSouthAsia ? (
              <>
                <Flame className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">SMOKE</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">CLEAR</span>
              </>
            )}
          </div>
        </div>

        {/* 3 Metric Blocks */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Upwind Fires</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {isSouthAsia ? metrics.upwind_active_fires : 0}
            </div>
            <div className="text-[9px] text-slate-500">VIIRS Thermal</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Transport Wind</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5 flex items-center justify-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              {isSouthAsia ? 'NW (315°)' : 'Variable'}
            </div>
            <div className="text-[9px] text-slate-500">
              {isSouthAsia ? `${metrics.mean_wind_vector.speed_kmh} km/h` : 'Local Air Shed'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Fire Corridor</div>
            <div className={`text-xs font-bold mt-1.5 ${isSouthAsia ? 'text-amber-400' : 'text-slate-400'}`}>
              {isSouthAsia ? 'Indo-Gangetic' : 'Outside Belt'}
            </div>
            <div className="text-[9px] text-slate-500">{isSouthAsia ? 'Active Risk' : 'Zero Transport'}</div>
          </div>
        </div>
      </div>

      {/* Advisory */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isSouthAsia
            ? `${metrics.advisory} Stubble smoke transported at low altitudes merges into nocturnal temperature inversions, compounding ground-level particulate spikes.`
            : `${city} is located outside the South Asian agricultural biomass fire corridor. Atmospheric particulates are governed by local urban emissions, topography, and synoptic weather fronts.`}
        </p>
      </div>
    </div>
  );
}
