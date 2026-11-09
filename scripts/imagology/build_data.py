# -*- coding: utf-8 -*-
"""
Собирает данные лаборатории имагологии в JSON для стендов и блокнотов Colab:

    python scripts/imagology/build_data.py

Пишет public/imagology/lab/data/{lexicon,places,presets}.json.
Нормализация (та же, что в lab.js и imago_utils.py): нижний регистр, ё/ѣ → е, і/ї/ѵ → и, ѳ → ф,
без диакритики латиницы; «й» сохраняется; концевой «ъ» снимается.
"""
import json
import os
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "public", "imagology", "lab", "data")
sys.path.insert(0, HERE)

import lexicon_src as LX  # noqa: E402
import places_src as PL  # noqa: E402
import presets_src as PR  # noqa: E402

LANGS = ("ru", "en", "fr", "de")
_MAP = str.maketrans({"ё": "е", "ѣ": "е", "і": "и", "ї": "и", "ѵ": "и", "ѳ": "ф"})


def norm(s: str) -> str:
    s = s.lower().translate(_MAP)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not (unicodedata.combining(ch) and ch != "̆"))
    s = unicodedata.normalize("NFC", s)
    if len(s) > 1 and s.endswith("ъ"):
        s = s[:-1]
    return s


def clean_entry(e):
    out = {}
    for k in ("p", "x", "no"):
        vals = [norm(v) for v in e.get(k, [])]
        seen, uniq = set(), []
        for v in vals:
            if v and v not in seen:
                seen.add(v)
                uniq.append(v)
        out[k] = uniq
    return out


def clean_items(items):
    res = []
    for it in items:
        d = {k: v for k, v in it.items() if k not in LANGS}
        d["forms"] = {lg: clean_entry(it[lg]) for lg in LANGS if lg in it}
        missing = [lg for lg in LANGS if lg not in it]
        if missing:
            raise SystemExit(f"{it['id']}: нет форм для {missing}")
        res.append(d)
    return res


def main():
    os.makedirs(OUT, exist_ok=True)

    rubric_ids = {r[0] for r in LX.RUBRICS}
    for t in LX.TRAITS:
        assert t["rubric"] in rubric_ids, t["id"]

    lexicon = {
        "version": 1,
        "groups": clean_items(LX.GROUPS),
        "rubrics": [{"id": r[0], "label": r[1]} for r in LX.RUBRICS],
        "traits": clean_items(LX.TRAITS),
        "motifs": clean_items(LX.MOTIFS),
        "stop": {lg: sorted({norm(w) for w in LX.STOP[lg].split()}) for lg in LX.STOP},
    }

    places = []
    for pid, label, lat, lon, region, prefixes, exact in PL.PLACES:
        places.append({
            "id": pid, "label": label, "lat": lat, "lon": lon, "region": region,
            "p": sorted({norm(x) for x in prefixes}), "x": sorted({norm(x) for x in exact}),
        })
    ids = [p["id"] for p in places]
    assert len(ids) == len(set(ids)), "дубли мест"
    for r in PL.ROUTES:
        for s in r["stops"]:
            assert s in ids, (r["id"], s)

    for key, t in PR.TEXTS.items():
        for src in [t["src"]] + ([t["tr"]] if t.get("tr") else []):
            if src["type"] == "wikisource":
                assert src.get("title"), f"{key}: у текста Викитеки нет точного названия страницы"
    for pair in PR.PAIRS:
        assert pair["left"] in PR.TEXTS and pair["right"] in PR.TEXTS, pair["id"]
        gids = {g["id"] for g in LX.GROUPS}
        mids = {m["id"] for m in LX.MOTIFS}
        assert set(pair["focus_groups"]) <= gids, pair["id"]
        assert set(pair["focus_motifs"]) <= mids, pair["id"]

    presets = {"version": 1, "texts": PR.TEXTS, "pairs": PR.PAIRS, "gallery": PR.GALLERY, "codebook": PR.CODEBOOK}

    def dump(name, obj):
        path = os.path.join(OUT, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        print(f"{name}: {os.path.getsize(path) // 1024} КБ")

    dump("lexicon.json", lexicon)
    dump("places.json", {"version": 1, "places": places, "routes": PL.ROUTES})
    dump("presets.json", presets)


if __name__ == "__main__":
    main()
