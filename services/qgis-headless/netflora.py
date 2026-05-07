"""
netflora.py — Netflora inference engine (stripped of QGIS dependency)
Original: Embrapa Acre / Fundo JBS — https://github.com/karasinski-mauro/Netflora
License: AGPL-3.0
"""
import os
import io
import json
import urllib.request
from pathlib import Path
from typing import Optional

# ── Model registry (from Netflora model_registry.json) ────────────────────────
MODEL_REGISTRY = {
    "amazonia_geral": {
        "biome": "Amazônia", "category": "Geral",
        "description": "59 espécies — palmeiras, madeireiras, não-madeireiras, açaí, castanheira",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_geral.onnx",
        "classes": {
            0:"Tucumã",1:"Jací",2:"Jauari",3:"Inajá",4:"Uricuri",5:"Babaçu",
            6:"Cocão",7:"Murumuru",8:"Açaí solteiro",9:"Açaí solteiro produtivo",
            10:"Buritirana",11:"Buriti",12:"Patauá",13:"Bacaba",14:"Paxiuba",
            15:"Cedro",16:"Castanheira",17:"Cumaru",18:"Sucupira",19:"Cacau",
            20:"Café",21:"Guaraná",22:"Açaí touceira",23:"Árvore morta",
            24:"Clareira",25:"Invasora",
        }
    },
    "amazonia_palmeiras": {
        "biome": "Amazônia", "category": "Palmeiras",
        "description": "15 espécies de palmeiras amazônicas",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_palmeiras.onnx",
        "classes": {
            0:"Tucumã",1:"Jací",2:"Jauari",3:"Inajá",4:"Uricuri",
            5:"Babaçu",6:"Cocão",7:"Murumuru",8:"Açaí solteiro",
            9:"Buritirana",10:"Buriti",11:"Patauá",12:"Bacaba",13:"Paxiuba",14:"Açaí touceira",
        }
    },
    "amazonia_acai_solteiro": {
        "biome": "Amazônia", "category": "Açaí-solteiro",
        "description": "Euterpe precatoria — 2 categorias (solteiro / produtivo)",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_acai_solteiro.onnx",
        "classes": {0:"Açaí solteiro", 1:"Açaí solteiro produtivo"}
    },
    "amazonia_castanheira": {
        "biome": "Amazônia", "category": "Castanheira",
        "description": "Detecção de Castanha-do-brasil (Bertholletia excelsa)",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_castanheira.onnx",
        "classes": {0:"Castanheira"}
    },
    "amazonia_invasora": {
        "biome": "Amazônia", "category": "Invasora",
        "description": "Detecção de espécies invasoras em florestas amazônicas",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/amazonia_invasora.onnx",
        "classes": {0:"Invasora"}
    },
    "cerrado_palmeiras": {
        "biome": "Cerrado", "category": "Palmeiras",
        "description": "Palmeiras do bioma Cerrado",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/cerrado_palmeiras.onnx",
        "classes": {0:"Buriti",1:"Babaçu",2:"Macaúba"}
    },
    "cerrado_carvao": {
        "biome": "Cerrado", "category": "Carvão/Biomassa",
        "description": "Espécies lenhosas para estimativa de biomassa/carvão",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/cerrado_carvao.onnx",
        "classes": {0:"Espécie lenhosa"}
    },
    "mata_atlantica_araucaria": {
        "biome": "Mata Atlântica", "category": "Araucária",
        "description": "Araucaria angustifolia — Pinheiro-do-paraná",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/mata_atlantica_araucaria.onnx",
        "classes": {0:"Araucária"}
    },
    "mata_atlantica_palmeiras": {
        "biome": "Mata Atlântica", "category": "Palmeiras",
        "description": "Palmeiras da Mata Atlântica (Euterpe edulis, Syagrus, etc.)",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/mata_atlantica_palmeiras.onnx",
        "classes": {0:"Juçara",1:"Jerivá",2:"Macaúba"}
    },
    "caatinga_palmeiras": {
        "biome": "Caatinga", "category": "Palmeiras",
        "description": "Palmeiras da Caatinga (Carnaubeira, Licuri, etc.)",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/caatinga_palmeiras.onnx",
        "classes": {0:"Carnaubeira",1:"Licuri",2:"Macaúba"}
    },
    "pantanal_palmeiras": {
        "biome": "Pantanal", "category": "Palmeiras",
        "description": "Palmeiras do Pantanal",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/pantanal_palmeiras.onnx",
        "classes": {0:"Bocaiuva",1:"Buriti"}
    },
    "pampa_palmeiras": {
        "biome": "Pampa", "category": "Palmeiras",
        "description": "Palmeiras do Pampa gaúcho",
        "url": "https://github.com/karasinski-mauro/Netflora/releases/download/v1.0/pampa_palmeiras.onnx",
        "classes": {0:"Butiá"}
    },
}

WEIGHTS_DIR = Path(__file__).parent / "weights" / "netflora"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

CONF_DEFAULT = 0.5
INPUT_SIZE   = 640


def list_models() -> list[dict]:
    return [
        {
            "id": model_id,
            "biome": info["biome"],
            "category": info["category"],
            "description": info["description"],
            "n_classes": len(info["classes"]),
            "downloaded": (WEIGHTS_DIR / f"{model_id}.onnx").exists(),
        }
        for model_id, info in MODEL_REGISTRY.items()
    ]


def ensure_model(model_id: str) -> Path:
    path = WEIGHTS_DIR / f"{model_id}.onnx"
    if path.exists():
        return path
    info = MODEL_REGISTRY.get(model_id)
    if not info:
        raise ValueError(f"Modelo desconhecido: {model_id}")
    print(f"[netflora] Baixando {model_id}.onnx de GitHub Releases...")
    urllib.request.urlretrieve(info["url"], str(path))
    print(f"[netflora] Modelo {model_id}.onnx baixado ({path.stat().st_size // 1024 // 1024} MB)")
    return path


def _load_session(model_path: Path):
    try:
        import onnxruntime as ort
    except ImportError:
        raise RuntimeError("onnxruntime não instalado. Execute: pip install onnxruntime")

    providers = []
    try:
        if "TensorrtExecutionProvider" in ort.get_available_providers():
            providers.append("TensorrtExecutionProvider")
    except Exception:
        pass
    try:
        if "CUDAExecutionProvider" in ort.get_available_providers():
            providers.append("CUDAExecutionProvider")
    except Exception:
        pass
    providers.append("CPUExecutionProvider")

    return ort.InferenceSession(str(model_path), providers=providers)


def _preprocess(image_bytes: bytes) -> "np.ndarray":
    import numpy as np
    try:
        from PIL import Image
    except ImportError:
        raise RuntimeError("Pillow não instalado. Execute: pip install Pillow")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((INPUT_SIZE, INPUT_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)[np.newaxis, :]  # NCHW
    return arr


def _nms(boxes: list, iou_threshold: float = 0.85) -> list:
    if not boxes:
        return []
    boxes = sorted(boxes, key=lambda b: b["confidence"], reverse=True)
    kept = []
    for b in boxes:
        overlap = False
        for k in kept:
            ix1 = max(b["x1"], k["x1"]); iy1 = max(b["y1"], k["y1"])
            ix2 = min(b["x2"], k["x2"]); iy2 = min(b["y2"], k["y2"])
            iw = max(0, ix2 - ix1); ih = max(0, iy2 - iy1)
            inter = iw * ih
            area_b = (b["x2"] - b["x1"]) * (b["y2"] - b["y1"])
            area_k = (k["x2"] - k["x1"]) * (k["y2"] - k["y1"])
            union = area_b + area_k - inter
            if union > 0 and inter / union >= iou_threshold:
                overlap = True
                break
        if not overlap:
            kept.append(b)
    return kept


def detect(
    model_id: str,
    image_bytes: bytes,
    confidence_threshold: float = CONF_DEFAULT,
) -> dict:
    """
    Run Netflora YOLO/ONNX detection on an image.
    Returns JSON-serializable dict with detections.
    """
    import numpy as np

    if model_id not in MODEL_REGISTRY:
        raise ValueError(f"Modelo desconhecido: {model_id}")

    model_info = MODEL_REGISTRY[model_id]
    model_path  = ensure_model(model_id)
    session     = _load_session(model_path)

    img_input = _preprocess(image_bytes)
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: img_input})

    # YOLO output shape: [1, num_detections, 5+num_classes] or [1, 5+nc, 8400]
    raw = outputs[0]
    if raw.ndim == 3 and raw.shape[1] > raw.shape[2]:
        raw = raw.transpose(0, 2, 1)  # → [1, anchors, 5+nc]

    raw = raw[0]  # remove batch dim → [anchors, 5+nc]
    nc = len(model_info["classes"])

    detections = []
    for row in raw:
        x_c, y_c, w, h = row[0], row[1], row[2], row[3]
        class_scores = row[4:4 + nc]
        conf = float(class_scores.max())
        if conf < confidence_threshold:
            continue
        cls = int(class_scores.argmax())
        x1 = float(x_c - w / 2); y1 = float(y_c - h / 2)
        x2 = float(x_c + w / 2); y2 = float(y_c + h / 2)
        # Physical constraints (from Netflora source)
        if not (1 <= w <= 200 and 1 <= h <= 200):
            continue
        ratio = w / (h + 1e-9)
        if not (0.3 <= ratio <= 3.0):
            continue
        detections.append({
            "class_id":   cls,
            "class_name": model_info["classes"].get(cls, f"classe_{cls}"),
            "confidence": round(conf, 3),
            "x1": round(x1), "y1": round(y1),
            "x2": round(x2), "y2": round(y2),
            "width":  round(w), "height": round(h),
        })

    detections = _nms(detections)

    # Summary by species
    summary: dict[str, dict] = {}
    for d in detections:
        name = d["class_name"]
        if name not in summary:
            summary[name] = {"count": 0, "avg_confidence": 0.0, "confidences": []}
        summary[name]["count"] += 1
        summary[name]["confidences"].append(d["confidence"])

    for name, s in summary.items():
        s["avg_confidence"] = round(sum(s["confidences"]) / len(s["confidences"]), 3)
        del s["confidences"]

    return {
        "model_id":   model_id,
        "biome":      model_info["biome"],
        "category":   model_info["category"],
        "total":      len(detections),
        "detections": detections,
        "summary":    summary,
    }
