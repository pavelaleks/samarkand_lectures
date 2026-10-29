# -*- coding: utf-8 -*-
"""
Л11 · Wikidata SPARQL: сущность места (без ключа)
=================================================

    python wikidata_place.py Paris
    python wikidata_place.py --label "Sarajevo"

Смотрим: Q-id, координаты (P625), страна (P17).
Омонимия нормальна: выбирайте строку осознанно и пишите wikidata_id в паспорт.
"""
from __future__ import annotations

import argparse
import json
import urllib.parse
import urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "SamarkandDH-Course/1.0 (lecture demo; contact: course-instructor)"


def sparql_query(label: str) -> list[dict]:
    # Английский label — самый стабильный для демо; при необходимости правьте вручную.
    q = f"""
SELECT ?item ?itemLabel ?coord ?countryLabel WHERE {{
  ?item rdfs:label "{label}"@en.
  OPTIONAL {{ ?item wdt:P625 ?coord. }}
  OPTIONAL {{ ?item wdt:P17 ?country. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ru,en". }}
}}
LIMIT 5
"""
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    rows = []
    for b in data.get("results", {}).get("bindings", []):
        rows.append(
            {
                "id": b.get("item", {}).get("value"),
                "label": b.get("itemLabel", {}).get("value"),
                "coord": b.get("coord", {}).get("value"),
                "country": b.get("countryLabel", {}).get("value"),
            }
        )
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("label_pos", nargs="?", help="English label, e.g. Paris")
    ap.add_argument("--label", help="English label (alternative to positional)")
    args = ap.parse_args()
    label = args.label or args.label_pos or "Paris"
    print(f"Wikidata · label={label!r}")
    rows = sparql_query(label)
    if not rows:
        print("Пусто. Попробуйте другой английский label (Caucasus, Judea, Galicia…).")
        return
    for r in rows:
        print("---")
        print("id     :", r["id"])
        print("label  :", r["label"])
        print("country:", r["country"] or "—")
        print("coord  :", r["coord"] or "—")
    print("\nВ методологии: укажите выбранный Q-id; не смешивайте омонимы в одном столбце.")


if __name__ == "__main__":
    main()
