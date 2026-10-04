# AeroSync India: Coupled Weather–Chemistry AQI Forecasting

A web platform that forecasts the Air Quality Index (AQI) for **any city in India** for the next **72 hours**. It couples meteorology and atmospheric chemistry in both directions, so aerosols change the weather and the weather changes the aerosols. Users search for a city, see its forecast, and track inversion strength and stubble-burning smoke.

> Project title is a working name. Rename it freely.

---

## 1. Problem

Standard AQI models treat weather as a fixed input. In polluted regions this is wrong:

- **Inversion layers** trap pollutants near the ground, especially on winter nights and mornings.
- **Dense PM2.5** blocks sunlight, which cools the surface, lowers the planetary boundary layer (PBL) and can strengthen the inversion.
- **Regional events** such as Punjab/Haryana stubble burning (Oct–Nov) send smoke across the Indo-Gangetic Plain (IGP) to many cities.

Ignoring this feedback loop makes forecasts miss pollution spikes. This project models it directly.

## 2. Features

| Feature | Description |
|---|---|
| City search | Type any Indian city, town or district (autocomplete) and get its forecast |
| India-wide map | Interactive map with AQI at every grid cell and monitoring station |
| 72-hour forecast | Hourly PM2.5, PM10, O₃, NO₂ and AQI with confidence band |
| Inversion tracker | Inversion strength (°C), PBL height and ventilation index per city |
| Stubble-burning module | Live fire counts and smoke plume trajectories toward the selected city |
| Feedback comparison | Toggle coupled vs. uncoupled forecast to see the effect of feedback |
| Health advisory | Plain-language guidance by AQI category (CPCB scale) |
| Compare cities | Overlay up to 4 cities on one chart |
| Alerts (optional) | Email/SMS/WhatsApp when a forecast crosses a chosen threshold |

## 3. System architecture

```
 ┌────────────────────┐   ┌──────────────────┐   ┌────────────────────┐
 │ Meteorology inputs │   │ Emissions        │   │ Observations       │
 │ GFS / ERA5 / IMD   │   │ EDGAR / SAFAR    │   │ CPCB, OpenAQ       │
 │                    │   │ NASA FIRMS fires │   │ MODIS/VIIRS AOD    │
 └─────────┬──────────┘   └────────┬─────────┘   └─────────┬──────────┘
           │                       │                       │
           ▼                       ▼                       ▼
     ┌──────────────────────────────────────────────────────────┐
     │  WRF-Chem (two-way coupled, nested domains)              │
     │  aerosol–radiation + aerosol–cloud feedback ON           │
     └───────────────────────────┬──────────────────────────────┘
                                 ▼
     ┌──────────────────────────────────────────────────────────┐
     │ Post-processing & bias correction (Python / xarray)      │
     │ - AQI computation (CPCB)  - inversion metrics            │
     │ - ML bias correction against station data                │
     └───────────────────────────┬──────────────────────────────┘
                                 ▼
          PostgreSQL + PostGIS / Zarr store / Redis cache
                                 ▼
                   FastAPI backend (REST + WebSocket)
                                 ▼
               React + MapLibre/Leaflet web dashboard
```

## 4. Modeling approach

### 4.1 Domains

| Domain | Resolution | Coverage |
|---|---|---|
| d01 | 12 km | All of India and surroundings |
| d02 | 4 km | Indo-Gangetic Plain (Punjab to West Bengal) |
| d03 | 1–2 km | On-demand nests for major metros (Delhi NCR, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, etc.) |

Smaller cities are served from d01/d02 output by interpolating to the city coordinates, with bias correction from the nearest stations.

### 4.2 Model configuration (WRF-Chem)

- Chemistry: `chem_opt = 11` (GOCART-based; try `RACM-MADE/SORGAM` if you need more detail for O₃ and secondary aerosols)
- Aerosol–radiation feedback: `aer_ra_feedback = 1`
- Aerosol–cloud interaction: `progn = 1` (optional, costs more)
- PBL scheme: YSU or MYNN (compare against radiosonde/IMD data)
- Biomass burning: FINN or the plume-rise module driven by NASA FIRMS fire detections
- Cycle: run every 6 or 12 hours with a 72-hour forecast
- Pollutants: PM2.5, PM10, O₃, NO, NO₂ (and CO, SO₂ if available)

### 4.3 Inversion metrics

Computed from model vertical profiles:

- **Inversion strength** = max temperature increase with height in the lowest ~1500 m (°C)
- **Inversion base height** (m)
- **PBL height** (m)
- **Ventilation index** = PBL height × mean boundary-layer wind speed (m²/s)

A simple risk label (Low / Moderate / High / Severe) is derived from these.

### 4.4 Stubble-burning plumes

1. Pull active fire detections (VIIRS/MODIS) from NASA FIRMS every 3 hours, filtered to Punjab, Haryana, western UP.
2. Convert fire radiative power to PM2.5 emissions and inject into WRF-Chem with plume rise.
3. Add tagged smoke tracers so the dashboard can show how much of a city's PM2.5 comes from burning.
4. Optionally run HYSPLIT back/forward trajectories for a fast, lightweight view.

### 4.5 AQI computation

Use the Indian CPCB AQI breakpoints (Good, Satisfactory, Moderate, Poor, Very Poor, Severe). City AQI = the highest sub-index among PM2.5, PM10, O₃, NO₂ and others. Keep breakpoints in one config file.

### 4.6 Bias correction (recommended)

Train a gradient-boosting or LSTM model on `forecast vs. station observation` pairs so city-level forecasts are calibrated. Keep the raw physical forecast available too.

## 5. City search design

India has thousands of towns, but you do not need a station in each.

1. **City index:** load a gazetteer (GeoNames India, Census of India, or OpenStreetMap places) into a `cities` table with `name, state, lat, lon, population, aliases`.
2. **Autocomplete:** use PostgreSQL `pg_trgm` (fuzzy matching) or Meilisearch/Typesense. Support spelling variants (Bengaluru/Bangalore, Mumbai/Bombay).
3. **Lookup:** when a user selects a city, find the nearest model grid cell(s) and nearby stations.
4. **Result:** return the interpolated forecast plus the bias-corrected value and the data quality note ("modeled" vs. "station-calibrated").
5. **Fallback:** if a location is not in the index, let the user click the map or allow browser geolocation.

## 6. Tech stack

| Layer | Choice |
|---|---|
| Model | WRF-Chem, WPS, NCL/Python tools |
| Data processing | Python, xarray, netCDF4, wrf-python, pandas |
| Storage | PostgreSQL + PostGIS, Zarr/NetCDF on object storage, Redis |
| Backend | FastAPI, Uvicorn, Celery (job queue) |
| Frontend | React + Vite, MapLibre GL or Leaflet, Recharts/ECharts, Tailwind |
| Scheduling | Cron, Airflow, or Prefect |
| Deployment | Docker, Docker Compose; HPC or cloud for the model |

> Google Maps is optional. MapLibre/Leaflet with OpenStreetMap tiles avoids API fees. If you prefer Google Maps, add `VITE_GOOGLE_MAPS_KEY`.

## 7. Suggested folder structure

```
aerosync-india/
├── model/                    # WRF-Chem configs and run scripts
│   ├── namelist.wps
│   ├── namelist.input
│   ├── run_forecast.sh
│   └── emissions/
├── pipeline/                 # data ingestion and post-processing
│   ├── fetch_gfs.py
│   ├── fetch_firms.py
│   ├── fetch_cpcb.py
│   ├── compute_aqi.py
│   ├── inversion_metrics.py
│   └── bias_correct.py
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── cities.py
│   │   │   ├── forecast.py
│   │   │   ├── fires.py
│   │   │   └── map.py
│   │   └── db.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # SearchBar, MapView, ForecastChart, InversionCard, PlumeLayer
│   │   ├── pages/
│   │   └── api.js
│   └── package.json
├── data/
│   └── cities_india.csv
├── docker-compose.yml
├── .env.example
└── README.md
```

## 8. API reference (planned)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cities/search?q=pune` | Autocomplete city search |
| GET | `/api/forecast?city_id=123` | 72-hour hourly forecast for a city |
| GET | `/api/forecast?lat=26.85&lon=80.95` | Forecast for any coordinates |
| GET | `/api/inversion?city_id=123` | Inversion strength, PBL height, ventilation index |
| GET | `/api/fires?hours=24` | Recent fire detections (GeoJSON) |
| GET | `/api/plume?city_id=123` | Smoke contribution and trajectory toward the city |
| GET | `/api/map/aqi?hour=12` | AQI grid/tiles for the India map |
| WS | `/ws/alerts` | Real-time updates and alerts |

Example response:

```json
{
  "city": "Lucknow",
  "model_run": "2026-10-04T00:00Z",
  "hourly": [
    {"time": "2026-10-04T06:00+05:30", "aqi": 245, "pm25": 118, "pm10": 190,
     "o3": 22, "no2": 41, "pbl_m": 210, "inversion_c": 5.8}
  ]
}
```

## 9. Getting started

### Prerequisites

- Linux server or HPC (the model needs many CPU cores; 64+ recommended for nested domains)
- Docker and Docker Compose
- Node.js 20+ and Python 3.11+
- Accounts/keys: NASA FIRMS, Copernicus (ERA5), optional Google Maps

### Setup

```bash
git clone https://github.com/<your-username>/aerosync-india.git
cd aerosync-india
cp .env.example .env        # fill in your keys

# Start database, cache, backend and frontend
docker compose up --build
```

Frontend: http://localhost:5173
API docs: http://localhost:8000/docs

### Load the city index

```bash
python pipeline/load_cities.py data/cities_india.csv
```

### Run a forecast cycle

```bash
bash model/run_forecast.sh        # WRF-Chem (HPC)
python pipeline/postprocess.py    # AQI, inversion metrics, bias correction
```

### Environment variables (`.env.example`)

```
DATABASE_URL=postgresql://user:pass@db:5432/aerosync
REDIS_URL=redis://redis:6379
FIRMS_MAP_KEY=your_nasa_firms_key
CPCB_API_KEY=your_key_if_required
OPENAQ_API_KEY=your_key
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_KEY=optional
```

## 10. Data sources

| Data | Source |
|---|---|
| Weather boundary conditions | NOAA GFS, ECMWF ERA5, IMD |
| Station air quality | CPCB (via data.gov.in / CPCB portal), OpenAQ |
| Fires | NASA FIRMS (VIIRS/MODIS) |
| Emissions | EDGAR, SAFAR-India, FINN (fires) |
| Satellite AOD | MODIS, VIIRS, Sentinel-5P |
| City list | GeoNames, Census of India, OpenStreetMap |

Check each source's license and rate limits before deploying publicly.

## 11. Validation

- Compare forecasts with CPCB station data (RMSE, MAE, correlation, hit rate for category).
- Compare PBL height with IMD radiosonde and satellite products.
- Run **coupled vs. uncoupled** experiments to quantify the benefit of feedback.
- Evaluate separately for stubble-burning season (Oct–Nov) and other seasons.

## 12. Limitations

- WRF-Chem is computationally expensive; city-level nests are run on demand or for key metros only.
- Station coverage is uneven across India; smaller towns rely on modeled values and nearby stations.
- Fire emissions are uncertain (detection gaps from cloud and overpass timing).
- Forecast quality falls with lead time; always show the confidence range.
- This is not a substitute for official CPCB/IMD advisories.

## 13. Roadmap

- [ ] Phase 1: City index, search, station data, basic AQI map
- [ ] Phase 2: WRF-Chem for IGP, 72-hour forecast, inversion metrics
- [ ] Phase 3: Stubble-burning module and plume view
- [ ] Phase 4: Bias correction with ML, city comparison, alerts
- [ ] Phase 5: Nests for major metros, mobile-friendly PWA, multilingual UI (Hindi, Tamil, Bengali, etc.)

## 14. Contributing

Fork the repository, create a feature branch, and open a pull request. Please include tests for pipeline and API changes.

## 15. License

Choose a license (MIT or Apache-2.0 is common). Note that some input datasets have their own terms.

## 16. Acknowledgements

WRF-Chem community (NCAR/NOAA), NASA FIRMS, CPCB, IMD, OpenAQ, ECMWF, NOAA.
