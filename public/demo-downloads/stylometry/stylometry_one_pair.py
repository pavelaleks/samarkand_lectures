#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Быстрое сравнение двух рассказов (для первого знакомства). Run без параметров."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from stylometry_lib import burrows_delta, corpus_stats, fw_vector, load_corpus, top_fw_diffs

TEXTS = ROOT / "sample_texts"


def main() -> None:
    corpus = load_corpus(TEXTS)
    slugs = sorted(corpus.keys())
    vectors = {}
    for slug, text in corpus.items():
        vectors[slug], _ = fw_vector(text)
    means, stds = corpus_stats([vectors[s] for s in slugs])

    a, b = "holodnaya-osen", "kavkaz"
    if a not in vectors or b not in vectors:
        print("Нет sample_texts — распакуйте ZIP в папку stylometry_bunin")
        return
    d = burrows_delta(vectors[a], vectors[b], means, stds)
    print(f"A = {a}\nB = {b}\nУчебная Delta = {d:.4f}\n")
    print("Топ |Δ| долей служебных слов:")
    for w, fa, fb, diff in top_fw_diffs(vectors[a], vectors[b], 12):
        print(f"  {w:10}  A={fa:.4f}  B={fb:.4f}  |Δ|={diff:.4f}")
    print("\nДальше: Run stylometry_lab.py для полного отчёта.")


if __name__ == "__main__":
    main()
