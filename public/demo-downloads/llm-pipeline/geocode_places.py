# -*- coding: utf-8 -*-
"""
Л11 · Геокодер топонимов «Тёмных аллей» (открытый API, без ключа)
================================================================

Photon (Komoot / данные OSM): https://photon.komoot.io/

    python geocode_places.py
    python geocode_places.py --query "Sarajevo"
    python geocode_places.py --from-csv my_places.csv   # колонки: id,label,query,story

Результат: output/tables/places.csv + output/raw/geo/*.json

Политика: пауза между запросами, понятный User-Agent с контактом.
Карта мест ≠ доказательство поэтики: сверяйте с текстом рассказа.
"""
from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "output"
RAW = OUT / "raw" / "geo"
TABLES = OUT / "tables"

# Учебный список — тот же смысл, что на сайте (вкладка «Другие API»).
DEFAULT_PLACES = [
    ("tula_road", "Тульская дорога", "Tula Oblast Russia", "Тёмные аллеи"),
    ("moscow", "Москва", "Moscow Russia", "Чистый понедельник"),
    ("paris", "Париж", "Paris France", "В Париже"),
    ("caucasus", "Кавказ", "Caucasus Mountains", "Кавказ"),
    ("sochi", "Сочи", "Sochi Russia", "Кавказ"),
    ("sarajevo", "Сараево", "Sarajevo", "Холодная осень"),
    ("madrid", "Мадрид", "Madrid Spain", "Мадрид"),
    ("camargue", "Камарг", "Camargue France", "Камарг"),
]

USER_AGENT = "SamarkandDH-Course/1.0 (lecture demo; contact: course-instructor)"
PHOTON = "https://photon.komoot.io/api/"


def photon(query: str) -> dict | None:
    url = PHOTON + "?" + urllib.parse.urlencode({"q": query, "limit": 3, "lang": "en"})
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    feats = data.get("features") or []
    if not feats:
        return None
    feat = feats[0]
    lon, lat = feat.get("geometry", {}).get("coordinates", [None, None])
    props = feat.get("properties") or {}
    display = ", ".join(
        str(props[k]) for k in ("name", "city", "state", "country") if props.get(k)
    )
    return {
        "lat": lat,
        "lon": lon,
        "display_name": display or query,
        "osm_link": (
            f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=6/{lat}/{lon}"
            if lat is not None and lon is not None
            else ""
        ),
        "raw": feat,
    }


def load_from_csv(path: Path) -> list[tuple[str, str, str, str]]:
    rows = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            rows.append(
                (
                    r.get("id") or r.get("query") or "row",
                    r.get("label") or r.get("query") or "",
                    r.get("query") or r.get("label") or "",
                    r.get("story") or "",
                )
            )
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Геокодер топонимов цикла Бунина")
    ap.add_argument("--query", help="Один произвольный запрос")
    ap.add_argument("--from-csv", type=Path, help="CSV с колонками id,label,query,story")
    ap.add_argument("--sleep", type=float, default=0.4, help="Пауза между запросами (сек)")
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    TABLES.mkdir(parents=True, exist_ok=True)

    if args.query:
        places = [("custom", args.query, args.query, "custom")]
    elif args.from_csv:
        places = load_from_csv(args.from_csv)
    else:
        places = DEFAULT_PLACES

    out_rows = []
    for pid, label, query, story in places:
        print(f"→ {label}  [{query}] … ", end="", flush=True)
        try:
            hit = photon(query)
        except Exception as e:
            print(f"ошибка: {e}")
            out_rows.append(
                {
                    "id": pid,
                    "label": label,
                    "query": query,
                    "story": story,
                    "lat": "",
                    "lon": "",
                    "display_name": f"ERROR: {e}",
                    "osm_link": "",
                    "source_api": "photon",
                }
            )
            time.sleep(args.sleep)
            continue

        (RAW / f"{pid}.json").write_text(
            json.dumps(hit["raw"] if hit else {}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        if not hit:
            print("не найдено")
            out_rows.append(
                {
                    "id": pid,
                    "label": label,
                    "query": query,
                    "story": story,
                    "lat": "",
                    "lon": "",
                    "display_name": "не найдено",
                    "osm_link": "",
                    "source_api": "photon",
                }
            )
        else:
            print(f"{hit['lat']:.4f}, {hit['lon']:.4f}  · {hit['display_name']}")
            out_rows.append(
                {
                    "id": pid,
                    "label": label,
                    "query": query,
                    "story": story,
                    "lat": hit["lat"],
                    "lon": hit["lon"],
                    "display_name": hit["display_name"],
                    "osm_link": hit["osm_link"],
                    "source_api": "photon",
                }
            )
        time.sleep(args.sleep)

    path = TABLES / "places.csv"
    fields = ["id", "label", "query", "story", "lat", "lon", "display_name", "osm_link", "source_api"]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out_rows)
    print(f"\nГотово: {path}  ({len(out_rows)} строк)")
    print("Дальше: сверьте display_name с текстом рассказа; стыкуйте с results.csv LLM-конвейера.")


if __name__ == "__main__":
    main()
