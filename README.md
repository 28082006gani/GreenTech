# AeroSync India: Coupled Weather–Chemistry AQI Forecasting

A full-stack web platform forecasting Air Quality Index (AQI) for **any city in India** for the next **72 hours**. It couples meteorology and atmospheric chemistry in both directions: aerosols change weather patterns (surface cooling, boundary layer suppression, and inversion strengthening), while weather governs aerosol dispersion and stubble-burning smoke transport.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested with v24)
- **Python**: 3.11+ (virtual environment configured in `backend/.venv`)

### 2. Launch All Services (One Command)
Run the launcher script from the repository root:
```powershell
py start_app.py
```
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

Alternatively, run services separately:
```powershell
# In terminal 1 (Backend):
cd e:\GreenTech
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000 --reload

# In terminal 2 (Frontend):
cd e:\GreenTech\frontend
npm.cmd run dev
```

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **India City Search & Autocomplete** | Instant search across 90+ Indian cities and districts with alias support (e.g. Bangalore/Bengaluru, Gurgaon/Gurugram). |
| **72-Hour Hourly Forecast** | Hourly PM2.5, PM10, NO₂, O₃, and composite Indian CPCB NAQI with 95% confidence bands. |
| **Coupled vs. Uncoupled Toggle** | Interactive toggle contrasting 2-way aerosol-radiation feedback vs uncoupled fixed weather. |
| **Inversion & Boundary Layer Tracker** | Inversion strength (°C in lower 1500m), Inversion base, PBL height, and Ventilation index ($m^2/s$). |
| **NASA FIRMS Stubble Smoke Module** | Active fire hotspots (VIIRS/MODIS) across Punjab/Haryana, estimated smoke % attribution, and wind transport corridors. |
| **Interactive Leaflet Map** | Map of India with real-time station AQI color markers and active thermal fire anomalies. |
| **Multi-City Comparison** | Compare up to 4 Indian cities simultaneously on one synchronized 72-hour forecast chart. |
| **CPCB Health Advisories** | Contextual health recommendations based on CPCB air quality severity categories. |

---

## 📁 Project Architecture

```
GreenTech/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── cities.py       # City search & reverse lookup
│   │   │   ├── forecast.py     # 72-hour hourly forecasts
│   │   │   ├── inversion.py    # PBL height & inversion metrics
│   │   │   ├── fires.py        # NASA FIRMS GeoJSON
│   │   │   ├── plume.py        # Stubble smoke attribution
│   │   │   └── map.py          # Station observation layers
│   │   ├── db.py               # In-memory gazetteer & spatial index
│   │   └── main.py             # FastAPI application entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx   # Autocomplete search
│   │   │   ├── CurrentAqiCard.jsx # Hero AQI gauge & health advisory
│   │   │   ├── ForecastChart.jsx  # Recharts 72h time-series & feedback toggle
│   │   │   ├── InversionCard.jsx  # Boundary layer & inversion sounding
│   │   │   ├── PlumeCard.jsx      # Agricultural smoke attribution
│   │   │   ├── MapView.jsx        # Leaflet map with stations & fires
│   │   │   └── CompareModal.jsx   # Multi-city comparison modal
│   │   ├── api.js              # API client
│   │   ├── App.jsx             # Main dashboard layout
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── pipeline/
│   ├── compute_aqi.py          # CPCB sub-index formulas & breakpoints
│   ├── inversion_metrics.py    # Inversion strength & ventilation index
│   ├── fetch_firms.py          # NASA FIRMS fire ingestion & plume trajectory
│   └── mock_forecast_generator.py # WRF-Chem coupled/uncoupled simulation
├── data/
│   └── cities_india.csv        # Indian cities gazetteer database
├── docker-compose.yml          # Containerized multi-service deployment
├── start_app.py                # Single-command launcher
└── README.md
```

---

## 🔌 API Reference

- `GET /api/cities/search?q=pune` — Autocomplete city search
- `GET /api/cities/all` — All indexed Indian cities
- `GET /api/forecast?city=Delhi` — 72-hour coupled & uncoupled forecast
- `GET /api/inversion?city=Delhi` — Temperature inversion & PBL metrics
- `GET /api/fires?hours=24` — NASA FIRMS active fire GeoJSON
- `GET /api/plume?city=Delhi` — Smoke contribution & wind trajectory
- `GET /api/map/stations` — India-wide station observations
- `GET /docs` — Swagger UI interactive documentation
