import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Navigation, Globe, Locate, Loader2 } from 'lucide-react';
import { searchCities, reverseGeocode } from '../api';

const QUICK_PLACES = [
  { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, place_type: 'City' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462, place_type: 'City' },
  { city: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.6340, lon: 74.8723, place_type: 'City' },
  { city: 'Shirdi', state: 'Maharashtra', country: 'India', lat: 19.7645, lon: 74.4770, place_type: 'Town' },
  { city: 'Udhagamandalam (Ooty)', state: 'Tamil Nadu', country: 'India', lat: 11.4134, lon: 76.6952, place_type: 'Town' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, place_type: 'City' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, place_type: 'City' },
  { city: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, place_type: 'Capital' },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, place_type: 'Capital' },
];

export default function SearchBar({ onSelectCity, currentCity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCities(query);
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (placeObj) => {
    setQuery(placeObj.city);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectCity(placeObj);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const rev = await reverseGeocode(lat, lon);
          if (rev) {
            const detectedPlace = {
              city: rev.city || `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
              state: rev.state || '',
              country: rev.country || 'India',
              lat: lat,
              lon: lon,
              place_type: rev.place_type || 'Local Locality',
            };
            setQuery(detectedPlace.city);
            onSelectCity(detectedPlace);
          } else {
            onSelectCity({
              city: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
              state: 'Your Location',
              country: 'India',
              lat: lat,
              lon: lon,
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied:', err.message);
        setGeolocating(false);
        alert('Could not access GPS. Please check browser location permissions or search by place name.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getPlaceBadgeClass = (type) => {
    switch (type) {
      case 'Village':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Town':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'Capital':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'City':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-30" ref={searchRef}>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-emerald-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search any village, town, or city worldwide (e.g. Shirdi, Zermatt, Paris, Rampur, Tokyo, Ooty)..."
          className="w-full pl-12 pr-32 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm md:text-base shadow-xl backdrop-blur-md"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* GPS Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={geolocating}
            title="Use My Current GPS Location"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
          >
            {geolocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Locate className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-96 overflow-y-auto">
          <div className="p-2.5 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 px-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Worldwide Places Found ({results.length})
            </span>
            <span className="text-[10px] text-slate-500 lowercase">use ↑↓ and Enter</span>
          </div>

          {results.map((c, idx) => {
            const isHighlight = idx === selectedIndex;
            return (
              <button
                key={`${c.id || idx}-${c.lat}-${c.lon}`}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b border-slate-800/40 last:border-b-0 group ${
                  isHighlight ? 'bg-slate-800 text-emerald-300' : 'hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isHighlight
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm md:text-base flex items-center gap-2">
                      <span>{c.city}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlaceBadgeClass(
                          c.place_type
                        )}`}
                      >
                        {c.place_type || 'Place'}
                      </span>
                      {c.aliases && c.aliases.length > 0 && (
                        <span className="text-xs text-slate-400 font-normal">
                          ({c.aliases.join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {c.state && <span>{c.state},</span>}
                      <span className="text-slate-300 font-medium">{c.country || 'India'}</span>
                      {c.population > 0 && (
                        <span className="text-slate-500">
                          • Pop: {(c.population / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  {c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Access Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-emerald-400" />
          Featured:
        </span>
        {QUICK_PLACES.map((item) => {
          const isActive = currentCity?.toLowerCase() === item.city.toLowerCase();
          return (
            <button
              key={`${item.city}-${item.country}`}
              onClick={() => {
                setQuery(item.city);
                onSelectCity(item);
              }}
              className={`text-xs px-2.5 py-1 rounded-full transition border font-medium flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{item.city}</span>
              <span className="text-[9px] text-slate-400 opacity-80">({item.place_type})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
