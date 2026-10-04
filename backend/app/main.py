from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.routes import cities, forecast, inversion, fires, plume, map as map_route

app = FastAPI(
    title="AeroSync India API",
    description="Coupled Weather–Chemistry AQI Forecasting Platform for Indian Cities (72-Hour Predictions, Inversion Tracking, and Stubble Smoke Dynamics)",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(cities.router)
app.include_router(forecast.router)
app.include_router(inversion.router)
app.include_router(fires.router)
app.include_router(plume.router)
app.include_router(map_route.router)

@app.get("/")
def root():
    return {
        "service": "AeroSync India API",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": {
            "cities_search": "/api/cities/search?q=delhi",
            "cities_all": "/api/cities/all",
            "forecast_72h": "/api/forecast?city=Delhi",
            "inversion_tracker": "/api/inversion?city=Delhi",
            "fires_firms": "/api/fires",
            "plume_trajectory": "/api/plume?city=Delhi",
            "stations_map": "/api/map/stations",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "aerosync-backend"}
