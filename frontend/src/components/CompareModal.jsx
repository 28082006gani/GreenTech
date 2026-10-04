import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GitCompare, Activity, Globe } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getForecast, searchCities } from '../api';

const CITY_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899'];

export default function CompareModal({ isOpen, onClose, initialCity }) {
  const [selectedCities, setSelectedCities] = useState([]);
  const [forecasts, setForecasts] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Sync initial city when opening modal
  useEffect(() => {
    if (isOpen) {
      const cityToUse = initialCity || 'Delhi';
      setSelectedCities((prev) => {
        if (!prev.includes(cityToUse)) {
          return [cityToUse, 'Mumbai'].slice(0, 4);
        }
        return prev;
      });
    }
  }, [isOpen, initialCity]);

  useEffect(() => {
    if (!isOpen || selectedCities.length === 0) return;

    const fetchAll = async () => {
      setLoading(true);
      const newForecasts = {};
      for (const c of selectedCities) {
        try {
          const res = await getForecast({ city: c });
          newForecasts[c] = res;
        } catch (err) {
          console.error(`Failed to fetch comparison for ${c}:`, err);
        }
      }
      setForecasts(newForecasts);
      setLoading(false);
    };

    fetchAll();
  }, [isOpen, selectedCities]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchCities(searchQuery);
      setSearchResults(res.results || []);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleAddCity = (cityName) => {
    if (selectedCities.length < 4 && !selectedCities.includes(cityName)) {
      setSelectedCities([...selectedCities, cityName]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveCity = (cityName) => {
    if (selectedCities.length > 1) {
      setSelectedCities(selectedCities.filter((c) => c !== cityName));
    }
  };

  // Build combined 72-hour comparison time-series safely
  const baseForecast = Object.values(forecasts)[0];
  const chartData = (baseForecast?.hourly_coupled || []).map((hourObj, idx) => {
    const rawTime = hourObj.time || '';
    const displayLabel = rawTime.includes(' ') ? rawTime.split(' ')[1] : `H${idx}`;
    const point = {
      displayTime: displayLabel,
      fullTime: rawTime,
    };
    selectedCities.forEach((cityName) => {
      const f = forecasts[cityName];
      if (f && f.hourly_coupled && f.hourly_coupled[idx]) {
        point[cityName] = f.hourly_coupled[idx].aqi;
      }
    });
    return point;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-slate-100">Multi-Location AQI Forecast Comparison</h2>
              <p className="text-xs text-slate-400">
                Compare up to 4 villages, towns or cities simultaneously over the next 72 hours
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Location Tags & Add Controls */}
        <div className="flex flex-wrap items-center gap-3 my-4">
          {selectedCities.map((cityName, idx) => (
            <div
              key={cityName}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold text-xs"
              style={{
                borderColor: CITY_COLORS[idx % CITY_COLORS.length],
                backgroundColor: `${CITY_COLORS[idx % CITY_COLORS.length]}15`,
                color: CITY_COLORS[idx % CITY_COLORS.length],
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CITY_COLORS[idx % CITY_COLORS.length] }} />
              {cityName}
              {selectedCities.length > 1 && (
                <button onClick={() => handleRemoveCity(cityName)} className="hover:opacity-80 ml-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {selectedCities.length < 4 && (
            <div className="relative">
              <input
                type="text"
                placeholder="+ Add place to compare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={`${r.id}-${r.lat}-${r.lon}`}
                      onClick={() => handleAddCity(r.city)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition flex items-center justify-between"
                    >
                      <span className="truncate">{r.city}, {r.state || r.country}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">({r.place_type || 'Place'})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison Chart */}
        <div className="h-80 w-full mt-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading 72-hour forecast comparisons...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayTime" stroke="#64748b" fontSize={11} interval={6} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {selectedCities.map((cityName, idx) => (
                  <Line
                    key={cityName}
                    type="monotone"
                    dataKey={cityName}
                    stroke={CITY_COLORS[idx % CITY_COLORS.length]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Current Comparison Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {selectedCities.map((c, idx) => {
            const f = forecasts[c];
            const curr = f?.current;
            if (!curr) return null;
            return (
              <div key={c} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="text-xs font-bold text-slate-300">{c}</div>
                <div className="text-2xl font-black mt-1" style={{ color: curr.color }}>
                  AQI {curr.aqi}
                </div>
                <div className="text-xs text-slate-400">{curr.category} • {curr.dominant}</div>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 border-t border-slate-800/80 pt-1.5">
                  <div>PM2.5: {curr.pm25} µg/m³</div>
                  <div>Inversion: ΔT {curr.inversion_strength_c}°C</div>
                  <div>PBL Height: {curr.pbl_height_m}m</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
