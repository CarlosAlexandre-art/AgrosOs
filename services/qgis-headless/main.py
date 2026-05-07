"""
main.py — QGIS Headless Microservice
Exposes HSAE + GLA algorithms as REST API endpoints (no QGIS required).

Usage:
  uvicorn main:app --host 0.0.0.0 --port 8000
  docker compose up
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dataclasses import asdict
from algorithms import (
    run_hbv96, run_hifd, run_atdi, run_gla, run_farm_hifd,
    HBVResult, HIFDResult, ATDIResult, GLAResult, FarmHIFDResult,
)

app = FastAPI(
    title="QGIS Headless Microservice",
    description="REST API for HSAE v6.01 + GLA hydrological algorithms (no QGIS dependency)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "qgis-headless", "version": "1.0.0"}


# ── HBV-96 ────────────────────────────────────────────────────────────────────
class HBVRequest(BaseModel):
    area_km2: float = Field(default=174000.0, ge=0.01, description="Catchment area (km²)")
    runoff_coeff: float = Field(default=0.38, ge=0.01, le=0.99, description="Runoff coefficient")
    mean_precip_mm_day: float = Field(default=2.99, ge=0, description="Mean daily precipitation (mm/day)")
    mean_temp_c: float = Field(default=25.0, description="Mean temperature (°C)")
    seed: int = Field(default=42, description="Random seed for reproducibility")


@app.post("/hbv96", response_model=dict, summary="HBV-96 Rainfall-Runoff Model")
def hbv96(body: HBVRequest):
    """
    Simulates 365-day annual rainfall-runoff cycle using the HBV-96 model.
    Returns NSE, KGE quality metrics and daily Q_sim/Q_ref series.
    """
    result = run_hbv96(
        area_km2=body.area_km2,
        runoff_coeff=body.runoff_coeff,
        mean_precip_mm_day=body.mean_precip_mm_day,
        mean_temp_c=body.mean_temp_c,
        seed=body.seed,
    )
    return asdict(result)


# ── HIFD ──────────────────────────────────────────────────────────────────────
class HIFDRequest(BaseModel):
    runoff_coeff: float = Field(default=0.38, ge=0.01, le=0.99)
    storage_capacity_bcm: float = Field(default=74.0, ge=0.0001, description="Reservoir capacity (BCM)")
    n_riparian_countries: int = Field(default=3, ge=1, le=20)
    dispute_level: int = Field(default=0, ge=0, le=4)


@app.post("/hifd", response_model=dict, summary="Human-Induced Flow Deficit")
def hifd(body: HIFDRequest):
    """
    Calculates the Human-Induced Flow Deficit (HIFD) index.
    Range: 5–80%. Higher = greater human-induced water deficit.
    """
    result = run_hifd(
        runoff_coeff=body.runoff_coeff,
        storage_capacity_bcm=body.storage_capacity_bcm,
        n_riparian_countries=body.n_riparian_countries,
        dispute_level=body.dispute_level,
    )
    return asdict(result)


class FarmHIFDRequest(BaseModel):
    runoff_coeff: float = Field(default=0.38, ge=0.1, le=0.8, description="Soil runoff coefficient")
    storage_capacity_m3: float = Field(default=0.0, ge=0, description="Farm reservoir/cistern capacity (m³)")
    deficit_days_30d: int = Field(default=0, ge=0, le=30, description="Days with soil moisture deficit in past 30 days")
    drought_intensity: int = Field(default=0, ge=0, le=4, description="Drought level (0=none, 4=critical)")


@app.post("/hifd/farm", response_model=dict, summary="Farm-Adapted HIFD")
def farm_hifd(body: FarmHIFDRequest):
    """
    Farm-scale water demand index adapted from HIFD.
    Suitable for irrigation planning at property level.
    """
    result = run_farm_hifd(
        runoff_coeff=body.runoff_coeff,
        storage_capacity_m3=body.storage_capacity_m3,
        deficit_days_30d=body.deficit_days_30d,
        drought_intensity=body.drought_intensity,
    )
    return asdict(result)


# ── ATDI ──────────────────────────────────────────────────────────────────────
class ATDIRequest(BaseModel):
    runoff_coeff: float = Field(default=0.38, ge=0.01, le=0.99)
    storage_capacity_bcm: float = Field(default=74.0, ge=0.0001)
    n_riparian_countries: int = Field(default=3, ge=1, le=20)
    dispute_level: int = Field(default=0, ge=0, le=4)


@app.post("/atdi", response_model=dict, summary="Alkhedir Transparency Deficit Index")
def atdi(body: ATDIRequest):
    """
    Calculates the ATDI (Alkhedir Transparency Deficit Index).
    Range: 5–95%. Measures water governance transparency deficit.
    """
    result = run_atdi(
        runoff_coeff=body.runoff_coeff,
        storage_capacity_bcm=body.storage_capacity_bcm,
        n_riparian_countries=body.n_riparian_countries,
        dispute_level=body.dispute_level,
    )
    return asdict(result)


# ── GLA Groundwater Vulnerability ─────────────────────────────────────────────
class GLARequest(BaseModel):
    soil: str = Field(description="Soil type: sand | sandy_loam | loam | clay_loam | clay")
    recharge: str = Field(description="Recharge rate: very_high | high | medium | low")
    geology: str = Field(description="Geology: gravel_sand | sandstone | basalt | crystalline | clay_silt")
    depth: str = Field(description="Water table depth: lt_5m | 5_15m | 15_30m | gt_30m")
    land_use: str = Field(description="Land use: intensive_agriculture | pasture | organic_agriculture | reforestation | native_forest")


@app.post("/gla", response_model=dict, summary="GLA Groundwater Vulnerability")
def gla(body: GLARequest):
    """
    Calculates aquifer vulnerability using the GLA (Geologisches Landesamt) method.
    Returns a score from 5 (very high vulnerability) to 25 (very low vulnerability).
    """
    valid = {
        "soil": {"sand", "sandy_loam", "loam", "clay_loam", "clay"},
        "recharge": {"very_high", "high", "medium", "low"},
        "geology": {"gravel_sand", "sandstone", "basalt", "crystalline", "clay_silt"},
        "depth": {"lt_5m", "5_15m", "15_30m", "gt_30m"},
        "land_use": {"intensive_agriculture", "pasture", "organic_agriculture", "reforestation", "native_forest"},
    }
    errors = [f"{f}: '{getattr(body, f)}'" for f, vals in valid.items() if getattr(body, f) not in vals]
    if errors:
        raise HTTPException(status_code=422, detail=f"Invalid values: {', '.join(errors)}")

    result = run_gla(
        soil=body.soil,
        recharge=body.recharge,
        geology=body.geology,
        depth=body.depth,
        land_use=body.land_use,
    )
    return asdict(result)
