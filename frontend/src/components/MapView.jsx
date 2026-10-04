import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Layers, Radio, Globe, Navigation, MousePointerClick } from 'lucide-react';
import { reverseGeocode } from '../api';

// Controller to smoothly pan/zoom map to selected city and invalidate size
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.5 });
      // Invalidate size to ensure tile grid refreshes without grey artifacting
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

// Click anywhere on map to fetch forecast for that location
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const rev = await reverseGeocode(lat, lng);
      if (rev) {
        onMapClick({
          city: rev.city || `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          state: rev.state || '',
          country: rev.country || 'India',
          lat: lat,
          lon: lng,
          place_type: rev.place_type || 'Map Pin',
        });
      } else {
        onMapClick({
          city: `Point (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          state: 'Coordinates',
          country: 'Global',
          lat: lat,
          lon: lng,
        });
      }
    },
  });
  return null;
}

export default function MapView({ stations, fires, onSelectCity, selectedCityCoords, selectedCityName }) {
  const [showStations, setShowStations] = useState(true);
  const [showFires, setShowFires] = useState(true);

  const defaultCenter = [22.9734, 78.6569]; // Geographic center of India
  const center = selectedCityCoords
    ? [selectedCityCoords.lat, selectedCityCoords.lon]
    : defaultCenter;

  const isIndia = selectedCityCoords
    ? selectedCityCoords.lat >= 6.0 &&
      selectedCityCoords.lat <= 38.0 &&
      selectedCityCoords.lon >= 68.0 &&
      selectedCityCoords.lon <= 98.0
    : true;

  const zoomLevel = selectedCityCoords ? (isIndia ? 8 : 10) : 5;

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#00b050';
    if (aqi <= 100) return '#92d050';
    if (aqi <= 200) return '#eab308';
    if (aqi <= 300) return '#f97316';
    if (aqi <= 400) return '#ef4444';
    return '#7030a0';
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
      {/* Header and Filter Switches */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">
              Interactive Worldwide AQI & Stubble Fire Map
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
            Click anywhere on the globe to inspect any village, town or coordinate.
          </p>
        </div>

        {/* Map Layers Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              showStations
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Key Stations ({stations?.length || 0})
          </button>

          <button
            onClick={() => setShowFires(!showFires)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              showFires
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Stubble Fires ({fires?.length || 0})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[480px] w-full rounded-2xl overflow-hidden mt-4 border border-slate-800 relative z-10">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={center} zoom={zoomLevel} />
          <MapClickHandler onMapClick={onSelectCity} />

          {/* CartoDB Dark Matter Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Active Fire Points (NASA FIRMS) */}
          {showFires &&
            fires?.map((fire, idx) => {
              const [lon, lat] = fire.geometry.coordinates;
              const { frp_mw, region } = fire.properties;
              return (
                <CircleMarker
                  key={`fire-${idx}`}
                  center={[lat, lon]}
                  radius={Math.min(8, Math.max(3, frp_mw / 25))}
                  pathOptions={{
                    fillColor: '#f97316',
                    color: '#ea580c',
                    weight: 1,
                    opacity: 0.9,
                    fillOpacity: 0.75,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <div className="font-bold text-orange-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> Active Stubble Hotspot
                      </div>
                      <div className="text-slate-300 mt-1">Region: {region}</div>
                      <div className="text-slate-400">Fire Radiative Power: {frp_mw} MW</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Coords: {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* City Monitoring Stations */}
          {showStations &&
            stations?.map((st) => {
              const aqiColor = getAqiColor(st.aqi);
              return (
                <CircleMarker
                  key={`st-${st.id}`}
                  center={[st.lat, st.lon]}
                  radius={7}
                  pathOptions={{
                    fillColor: aqiColor,
                    color: '#ffffff',
                    weight: 1.5,
                    opacity: 0.9,
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{
                    click: () => onSelectCity(st),
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs min-w-[150px]">
                      <div className="flex items-center justify-between font-bold text-slate-100 border-b border-slate-700 pb-1 mb-1.5">
                        <span>{st.city}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-extrabold"
                          style={{ backgroundColor: aqiColor, color: '#ffffff' }}
                        >
                          AQI {st.aqi}
                        </span>
                      </div>
                      <div className="text-slate-300">Category: {st.category}</div>
                      <div className="text-slate-300">Dominant: {st.dominant}</div>
                      <div className="text-slate-400">PM2.5: {st.pm25} µg/m³</div>
                      <div className="text-slate-400">PBL Inversion: ΔT {st.inversion_strength_c}°C</div>
                      <button
                        onClick={() => onSelectCity(st)}
                        className="mt-2 w-full text-center bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1 px-2 rounded text-[11px] transition cursor-pointer"
                      >
                        Load 72h Forecast →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Active Pin for Selected Village/Town/City */}
          {selectedCityCoords && (
            <CircleMarker
              center={[selectedCityCoords.lat, selectedCityCoords.lon]}
              radius={10}
              pathOptions={{
                fillColor: '#38bdf8',
                color: '#ffffff',
                weight: 2.5,
                opacity: 1,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="p-1 text-xs font-semibold text-sky-400">
                  📍 {selectedCityName || 'Selected Location'}
                  <div className="text-slate-400 font-mono text-[10px]">
                    {selectedCityCoords.lat.toFixed(3)}°, {selectedCityCoords.lon.toFixed(3)}°
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {/* Legend Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-300">NAQI Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#00b050]" />
            <span>0-50 Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#92d050]" />
            <span>51-100 Satisfactory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#eab308]" />
            <span>101-200 Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f97316]" />
            <span>201-300 Poor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span>301-400 Very Poor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7030a0]" />
            <span>401+ Severe</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectCity({ city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 })}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
          >
            Reset to India
          </button>
        </div>
      </div>
    </div>
  );
}
