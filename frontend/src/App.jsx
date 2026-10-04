import React, { useState, useEffect } from 'react';
import {
  Wind,
  Flame,
  Layers,
  RefreshCw,
  GitCompare,
  Activity,
  ShieldAlert,
  MapPin,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Globe,
} from 'lucide-react';
import { ParallaxHero } from './components/ui/demo';
import SearchBar from './components/SearchBar';
import CurrentAqiCard from './components/CurrentAqiCard';
import ForecastChart from './components/ForecastChart';
import InversionCard from './components/InversionCard';
import PlumeCard from './components/PlumeCard';
import MapView from './components/MapView';
import CompareModal from './components/CompareModal';
import ErrorBoundary from './components/ErrorBoundary';
import { getForecast, getInversion, getFires, getPlume, getMapStations } from './api';

export default function App() {
  const [selectedCity, setSelectedCity] = useState({
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090,
    place_type: 'Capital',
  });
  const [forecast, setForecast] = useState(null);
  const [inversion, setInversion] = useState(null);
  const [plume, setPlume] = useState(null);
  const [fires, setFires] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Fetch forecast and location-specific data
  const loadCityData = async (placeObj) => {
    setLoading(true);
    try {
      const [forecastData, invData, plumeData] = await Promise.all([
        getForecast({
          cityId: placeObj.id,
          city: placeObj.city,
          state: placeObj.state,
          country: placeObj.country || 'India',
          lat: placeObj.lat,
          lon: placeObj.lon,
          population: placeObj.population,
        }),
        getInversion({
          cityId: placeObj.id,
          city: placeObj.city,
          state: placeObj.state,
          country: placeObj.country || 'India',
          lat: placeObj.lat,
          lon: placeObj.lon,
        }),
        getPlume({
          cityId: placeObj.id,
          city: placeObj.city,
          country: placeObj.country || 'India',
          lat: placeObj.lat,
          lon: placeObj.lon,
        }),
      ]);
      setForecast(forecastData);
      setInversion(invData);
      setPlume(plumeData);
      setSelectedCity(placeObj);
    } catch (err) {
      console.error('Failed to load location data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [firesData, stationsData] = await Promise.all([
          getFires(24),
          getMapStations(),
        ]);
        setFires(firesData.features || []);
        setStations(stationsData.stations || []);
      } catch (err) {
        console.error('Failed to fetch initial map data:', err);
      }
      await loadCityData(selectedCity);
    };
    init();
  }, []);

  const handleCitySelect = (placeObj) => {
    loadCityData(placeObj);
    const dashElement = document.getElementById('dashboard-section');
    if (dashElement) {
      dashElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDashboard = () => {
    const dashElement = document.getElementById('dashboard-section');
    if (dashElement) {
      dashElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* 3D Parallax Atmospheric Hero Section */}
      <section className="relative w-full">
        <ParallaxHero
          title="AEROSYNC"
          subtitle="Coupled Weather–Chemistry AQI Forecasting for Every Village, Town & City Worldwide"
        >
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToDashboard}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 hover:brightness-110 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Explore Live 72h Forecast</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-6 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-emerald-400" />
              <span>Compare Places</span>
            </button>
          </div>
        </ParallaxHero>
      </section>

      {/* Sticky Navigation Header */}
      <header className="border-y border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Wind className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  AeroSync Worldwide
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Coupled WRF-Chem
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">
                Global 72h Inversion, Boundary Layer & Plume Forecasting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition shadow-sm cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            <button
              onClick={() => loadCityData(selectedCity)}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
              title="Refresh forecast cycle"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Section */}
      <main id="dashboard-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* City / Village Search Bar */}
        <section>
          <SearchBar onSelectCity={handleCitySelect} currentCity={selectedCity?.city} />
        </section>

        {/* Current AQI Hero Display */}
        {forecast && (
          <section>
            <CurrentAqiCard forecast={forecast} />
          </section>
        )}

        {/* 72-Hour Forecast & Coupled vs Uncoupled Chart */}
        {forecast && (
          <section>
            <ErrorBoundary fallbackTitle="72-Hour Forecast Chart Encountered a Problem">
              <ForecastChart forecast={forecast} />
            </ErrorBoundary>
          </section>
        )}

        {/* Inversion Dynamics & Stubble Plumes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InversionCard inversion={inversion} forecast={forecast} />
          <PlumeCard
            plume={plume}
            firesCount={fires.length}
            city={selectedCity.city}
            country={selectedCity.country}
          />
        </section>

        {/* Interactive Worldwide Map */}
        <section>
          <ErrorBoundary fallbackTitle="Map Component Encountered a Problem">
            <MapView
              stations={stations}
              fires={fires}
              onSelectCity={handleCitySelect}
              selectedCityCoords={{ lat: selectedCity.lat, lon: selectedCity.lon }}
              selectedCityName={selectedCity.city}
            />
          </ErrorBoundary>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-slate-400">AeroSync Worldwide Platform</p>
            <p className="mt-0.5">
              Two-way coupled meteorology–chemistry forecasting for every village, town and city across the globe.
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Global Geocoding (Open-Meteo & OSM)</span>
            <span>•</span>
            <span>Worldwide Coordinates</span>
            <span>•</span>
            <span>72h Hourly Cycle</span>
          </div>
        </div>
      </footer>

      {/* Multi-City Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialCity={selectedCity.city}
      />
    </div>
  );
}
