"""
algorithms.py — Pure Python ports of HSAE v6.01 + GLA QGIS algorithms.
No QGIS dependency. All math extracted from the original plugin source.

Original QGIS plugins:
  HSAE v6.0.7 — Author: Seifeldin M.G. Alkhedir · ORCID: 0000-0003-0821-2991
  GroundwaterVulnerability (GLA) — Author: Christian Böhnke
"""
import math
import random
from dataclasses import dataclass, asdict
from typing import Literal


# ── HBV-96 Hydrological Model ──────────────────────────────────────────────────
@dataclass
class HBVResult:
    nse: float
    kge: float
    days: list[dict]
    mean_q_sim: float
    mean_q_ref: float


def run_hbv96(
    area_km2: float = 174000.0,
    runoff_coeff: float = 0.38,
    mean_precip_mm_day: float = 2.99,
    mean_temp_c: float = 25.0,
    seed: int = 42,
) -> HBVResult:
    """
    HBV-96 calibration simulation (365-day annual cycle).
    Ported from hsae_qgis/algorithms/hbv_algorithm.py.
    """
    random.seed(seed)
    n = 365
    fc = 250 * runoff_coeff
    lp = 0.7
    k1 = 0.05
    k2 = 0.005

    sm, suz, slz = fc * 0.5, 0.0, 0.0
    q_sim, q_ref = [], []

    for i in range(n):
        doy = i + 1
        p = max(0, mean_precip_mm_day * (0.5 + 1.5 * max(0, math.sin(
            math.pi * (doy - 120) / 180)) ** 1.4) + random.gauss(0, 0.3))
        et = max(0, 0.4 * mean_temp_c * min(1, sm / (fc * lp + 1e-9)))
        sm = max(0, min(fc, sm + p - et - k1 * (sm / (fc + 1e-9)) ** 2 * fc))
        rch = max(0, p - et - (fc - sm))
        suz = max(0, suz + rch - k1 * suz)
        slz = max(0, slz + k1 * suz * 0.3 - k2 * slz)
        q = max(0, (k1 * suz + k2 * slz) * area_km2 / 86.4)
        q_sim.append(q)
        qr = max(0, area_km2 * runoff_coeff * p / 86.4 * (
            0.7 + 0.6 * max(0, math.sin(math.pi * (doy - 130) / 150)) ** 0.8
        ) + random.gauss(0, 1))
        q_ref.append(qr)

    mean_r = sum(q_ref) / n
    mean_s = sum(q_sim) / n
    nse = 1 - sum((o - s) ** 2 for o, s in zip(q_ref, q_sim)) / (
        sum((o - mean_r) ** 2 for o in q_ref) + 1e-9)
    std_r = (sum((o - mean_r) ** 2 for o in q_ref) / n) ** 0.5
    std_s = (sum((s - mean_s) ** 2 for s in q_sim) / n) ** 0.5
    r = sum((o - mean_r) * (s - mean_s) for o, s in zip(q_ref, q_sim)) / (
        n * std_r * std_s + 1e-9)
    kge = 1 - ((r - 1) ** 2 + (std_s / (std_r + 1e-9) - 1) ** 2 + (
        mean_s / (mean_r + 1e-9) - 1) ** 2) ** 0.5

    days_out = [
        {"day": i + 1, "q_sim": round(q_sim[i], 2), "q_ref": round(q_ref[i], 2)}
        for i in range(n)
    ]

    return HBVResult(
        nse=round(max(-1, min(1, nse)), 3),
        kge=round(max(-1, min(1, kge)), 3),
        days=days_out,
        mean_q_sim=round(mean_s, 3),
        mean_q_ref=round(mean_r, 3),
    )


# ── HIFD — Human-Induced Flow Deficit ─────────────────────────────────────────
@dataclass
class HIFDResult:
    hifd_pct: float
    interpretation: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def run_hifd(
    runoff_coeff: float = 0.38,
    storage_capacity_bcm: float = 74.0,
    n_riparian_countries: int = 3,
    dispute_level: int = 0,
) -> HIFDResult:
    """
    Human-Induced Flow Deficit index.
    Ported from hsae_qgis/algorithms/hifd_algorithm.py.

    For farm use: scale storage_capacity_bcm accordingly.
    E.g., a 500,000 m³ reservoir = 0.0005 BCM.
    """
    hifd = min(80.0, max(5.0,
        8 + min(storage_capacity_bcm / 3, 15)
        + (1 - runoff_coeff) * 12
        + dispute_level * 5
        + (n_riparian_countries - 2) * 3
    ))
    hifd = round(hifd, 2)

    if hifd < 20:
        risk, interp = "LOW", "Baixo déficit — disponibilidade hídrica adequada"
    elif hifd < 40:
        risk, interp = "MEDIUM", "Déficit moderado — monitorar disponibilidade hídrica"
    elif hifd < 60:
        risk, interp = "HIGH", "Déficit elevado — restrição significativa de fluxo"
    else:
        risk, interp = "CRITICAL", "Déficit crítico — risco severo de escassez hídrica"

    return HIFDResult(hifd_pct=hifd, interpretation=interp, risk_level=risk)


# Farm-adapted HIFD (normalized to farm scale)
@dataclass
class FarmHIFDResult:
    demand_index: float           # 0–100 (higher = more water stress)
    status: Literal["OK", "ALERTA", "CRÍTICO"]
    label: str
    recommendation: str


def run_farm_hifd(
    runoff_coeff: float,          # 0.2–0.5 from soil type
    storage_capacity_m3: float,   # farm reservoir/cistern in m³ (0 if none)
    deficit_days_30d: int,        # days with soil moisture deficit in past 30d
    drought_intensity: int = 0,   # 0–4 from precip anomaly
) -> FarmHIFDResult:
    """
    Farm-scale adaptation of HIFD.
    Inputs mapped to farm-relevant parameters.
    """
    # Normalize storage to BCM-equivalent (scale: 1 BCM = 1e9 m³)
    cap_norm = storage_capacity_m3 / 1e9

    # 1 farm user, drought_intensity maps to dispute_level
    hifd_raw = min(80.0, max(5.0,
        8 + min(cap_norm / 3, 15)
        + (1 - runoff_coeff) * 12
        + drought_intensity * 5
        + (1 - 2) * 3              # nc=1
    ))

    # Blend with observed deficit days (0–30 → adds 0–20 to index)
    observed_stress = (deficit_days_30d / 30.0) * 20
    demand_index = round(min(100, hifd_raw + observed_stress), 1)

    if demand_index < 30:
        status, label = "OK", "Baixa demanda"
        rec = "Disponibilidade hídrica adequada — manutenção normal"
    elif demand_index < 55:
        status, label = "ALERTA", "Demanda moderada"
        rec = "Monitore o nível de reservatórios e o calendário de irrigação"
    else:
        status, label = "CRÍTICO", "Alta demanda"
        rec = "Acione irrigação de emergência e reduza evapotranspiração com cobertura"

    return FarmHIFDResult(demand_index=demand_index, status=status,
                          label=label, recommendation=rec)


# ── ATDI — Alkhedir Transparency Deficit Index ────────────────────────────────
@dataclass
class ATDIResult:
    atdi_pct: float
    risk_level: str
    un_articles: list[str]


def run_atdi(
    runoff_coeff: float = 0.38,
    storage_capacity_bcm: float = 74.0,
    n_riparian_countries: int = 3,
    dispute_level: int = 0,
) -> ATDIResult:
    """
    Alkhedir Transparency Deficit Index.
    Ported from hsae_qgis/algorithms/atdi_algorithm.py.
    """
    atdi = min(95.0, max(5.0,
        15 + dispute_level * 12
        + min(storage_capacity_bcm / 2, 20)
        + (n_riparian_countries - 2) * 8
        + (1 - runoff_coeff) * 10
    ))
    atdi = round(atdi, 2)

    articles = ["Art.5", "Art.9"]
    if atdi >= 40:
        articles.append("Art.7")
    if atdi >= 55:
        articles.append("Art.33")

    if atdi < 30:
        risk = "LOW"
    elif atdi < 50:
        risk = "MEDIUM"
    elif atdi < 70:
        risk = "HIGH"
    else:
        risk = "CRITICAL"

    return ATDIResult(atdi_pct=atdi, risk_level=risk, un_articles=articles)


# ── GLA Groundwater Vulnerability (simplified) ────────────────────────────────
# Full raster version requires GDAL/numpy; this is the scoring logic only.

GLA_SOIL_SCORE = {
    "sand": 1, "sandy_loam": 2, "loam": 3, "clay_loam": 4, "clay": 5,
}
GLA_RECHARGE_SCORE = {
    "very_high": 1, "high": 2, "medium": 3, "low": 4,
}
GLA_GEOLOGY_SCORE = {
    "gravel_sand": 1, "sandstone": 2, "basalt": 3, "crystalline": 4, "clay_silt": 5,
}
GLA_DEPTH_SCORE = {
    "lt_5m": 1, "5_15m": 2, "15_30m": 3, "gt_30m": 4,
}
GLA_LANDUSE_SCORE = {
    "intensive_agriculture": 1, "pasture": 2, "organic_agriculture": 3,
    "reforestation": 4, "native_forest": 5,
}


@dataclass
class GLAResult:
    total_score: int
    vulnerability_level: str
    vulnerability_label: str
    color: str
    description: str


def run_gla(
    soil: str,
    recharge: str,
    geology: str,
    depth: str,
    land_use: str,
) -> GLAResult:
    scores = {
        "soil":     GLA_SOIL_SCORE.get(soil, 3),
        "recharge": GLA_RECHARGE_SCORE.get(recharge, 3),
        "geology":  GLA_GEOLOGY_SCORE.get(geology, 3),
        "depth":    GLA_DEPTH_SCORE.get(depth, 3),
        "land_use": GLA_LANDUSE_SCORE.get(land_use, 3),
    }
    total = sum(scores.values())

    if total <= 8:
        level, label, color = "VERY_HIGH", "Muito Alta", "#dc2626"
        desc = "Aquífero extremamente exposto. Alto risco de contaminação."
    elif total <= 11:
        level, label, color = "HIGH", "Alta", "#ea580c"
        desc = "Baixa proteção natural. Uso do solo influencia diretamente a qualidade."
    elif total <= 15:
        level, label, color = "MEDIUM", "Média", "#ca8a04"
        desc = "Proteção moderada. Risco relevante em uso intensivo."
    elif total <= 19:
        level, label, color = "LOW", "Baixa", "#16a34a"
        desc = "Boa proteção natural. Aquífero relativamente seguro."
    else:
        level, label, color = "VERY_LOW", "Muito Baixa", "#0891b2"
        desc = "Proteção elevada. Aquífero bem isolado."

    return GLAResult(total_score=total, vulnerability_level=level,
                     vulnerability_label=label, color=color, description=desc)
