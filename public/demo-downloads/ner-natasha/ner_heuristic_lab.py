#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Учебный NER без Natasha: слова с заглавной буквы (как на сайте). Для сравнения с лекцией 6."""

from __future__ import annotations

import csv
import re
import sys
from collections import Counter
from pathlib import Path

CAP_RE = re.compile(r"[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?")

ROOT = Path(__file__).resolve().parent
TEXTS = ROOT / "sample_texts"
OUT = ROOT / "out"


def scan(text: str) -> list[tuple[str, int]]:
    c = Counter(CAP_RE.findall(text))
    return sorted(c.items(), key=lambda x: (-x[1], x[0]))


def main() -> None:
    paths = sorted(TEXTS.glob("*.txt"))
    if not paths:
        print("Положите .txt в sample_texts/")
        sys.exit(1)
    target = paths[0]
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    text = target.read_text(encoding="utf-8")
    rows = scan(text)
    OUT.mkdir(parents=True, exist_ok=True)
    out_csv = OUT / f"heuristic_{target.stem}.csv"
    with out_csv.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["candidate", "count", "note"])
        for label, cnt in rows[:80]:
            w.writerow([label, cnt, "проверить вручную"])
    print(f"Файл: {target.name}")
    print(f"Кандидатов (заглавная): {len(rows)}")
    print("Топ-15:")
    for label, cnt in rows[:15]:
        print(f"  {label} ×{cnt}")
    print(f"\nCSV: {out_csv}")
    print("Сравните с ner_natasha_lab.py — где эвристика ошибается?")


if __name__ == "__main__":
    main()
