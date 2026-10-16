#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ПОЛНАЯ ЛАБОРАТОРИЯ · NER (Natasha) · рассказы Бунина · лекция 6

Run без параметров — обработает все sample_texts/*.txt
Или: python ner_natasha_lab.py sample_texts/holodnaya-osen.txt

Первый запуск: pip install natasha (скачает модели — может занять время).

Выход в out/:
  ner_report.html, ner_entities.csv, ner_bunin.xlsx (если openpyxl)
"""

from __future__ import annotations

import csv
import html
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEXTS = ROOT / "sample_texts"
OUT = ROOT / "out"

ORDER_HINT = [
    "temnye-allei.txt",
    "holodnaya-osen.txt",
    "natali.txt",
    "chistyj-ponedelnik.txt",
]


def load_natasha():
    try:
        from natasha import Doc, MorphVocab, NewsEmbedding, NewsNERTagger, Segmenter
    except ImportError:
        print("Natasha не установлена. В venv PyCharm выполните:")
        print("  python -m pip install -r requirements.txt")
        sys.exit(2)
    segmenter = Segmenter()
    morph = MorphVocab()
    emb = NewsEmbedding()
    ner = NewsNERTagger(emb)
    return segmenter, morph, ner


def analyze_file(path: Path, segmenter, morph, ner) -> dict:
    from natasha import Doc

    text = path.read_text(encoding="utf-8")
    doc = Doc(text)
    doc.segment(segmenter)
    doc.tag_ner(ner)
    for span in doc.spans:
        span.normalize(morph)
    by_type: dict[str, list[str]] = defaultdict(list)
    seen: set[tuple[str, str]] = set()
    for span in doc.spans:
        label = span.normal or span.text
        key = (span.type, label)
        if key in seen:
            continue
        seen.add(key)
        by_type[span.type].append(label)
    return {"file": path.name, "slug": path.stem, "spans": len(doc.spans), "by_type": dict(by_type)}


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["slug", "type", "entity", "count_in_list"], delimiter=";")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_html(path: Path, results: list[dict]) -> None:
    parts = []
    for r in results:
        blocks = []
        for typ in sorted(r["by_type"]):
            items = r["by_type"][typ][:50]
            lis = "".join(f"<li>{html.escape(x)}</li>" for x in items)
            blocks.append(f"<h3>{html.escape(typ)} ({len(r['by_type'][typ])})</h3><ul>{lis}</ul>")
        parts.append(
            f"<section><h2>{html.escape(r['file'])}</h2>"
            f"<p>Сущностей (span): {r['spans']}</p>{''.join(blocks)}</section>"
        )
    body = f"""<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/>
<title>NER Natasha · Бунин</title>
<style>body{{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}}
section{{margin-bottom:2rem;border-bottom:1px solid #ddd;padding-bottom:1rem}}</style></head>
<body><h1>NER (Natasha) · учебный отчёт</h1>
<p><strong>Задание:</strong> выпишите 2 ложных срабатывания и 1 пропущенное имя.</p>
{''.join(parts)}
<p>Сравните с <code>ner_heuristic_lab.py</code> и с подсветкой на сайте.</p>
</body></html>"""
    path.write_text(body, encoding="utf-8")


def write_excel(path: Path, flat_rows: list[dict]) -> None:
    from openpyxl import Workbook
    from openpyxl.styles import Font

    wb = Workbook()
    ws = wb.active
    ws.title = "entities"
    fields = ["slug", "type", "entity"]
    ws.append(fields)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for r in flat_rows:
        ws.append([r["slug"], r["type"], r["entity"]])
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def collect_paths() -> list[Path]:
    if len(sys.argv) > 1:
        return [Path(sys.argv[1]).resolve()]
    ordered = []
    for name in ORDER_HINT:
        p = TEXTS / name
        if p.exists():
            ordered.append(p)
    for p in sorted(TEXTS.glob("*.txt")):
        if p not in ordered:
            ordered.append(p)
    return ordered


def main() -> None:
    paths = collect_paths()
    if not paths:
        print("Нет файлов в sample_texts/")
        sys.exit(1)
    segmenter, morph, ner = load_natasha()
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    flat: list[dict] = []
    for path in paths:
        print(f"… {path.name}")
        r = analyze_file(path, segmenter, morph, ner)
        results.append(r)
        for typ, entities in r["by_type"].items():
            for ent in entities:
                flat.append({"slug": r["slug"], "type": typ, "entity": ent, "count_in_list": 1})
        print(f"   spans={r['spans']}, типы: {', '.join(sorted(r['by_type'])) or '—'}")

    write_csv(OUT / "ner_entities.csv", flat)
    write_html(OUT / "ner_report.html", results)
    try:
        write_excel(OUT / "ner_bunin.xlsx", flat)
    except ImportError:
        print("openpyxl нет — Excel пропущен.")

    print("\n=== Готово ===")
    print(f"out/ner_report.html, out/ner_entities.csv")
    print("Проверка вручную: 2 false positive + 1 пропуск на рассказ.")


if __name__ == "__main__":
    main()
