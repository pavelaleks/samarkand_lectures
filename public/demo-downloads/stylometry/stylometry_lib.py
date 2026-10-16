# -*- coding: utf-8 -*-
"""Общие функции учебной стилиометрии (лекция 5): Delta по служебным словам."""

from __future__ import annotations

import html
import json
import math
import re
import statistics
from collections import Counter
from pathlib import Path

WORD_RE = re.compile(r"[А-Яа-яЁё]+", re.UNICODE)

FUNCTION_WORDS = """
и в на с не что он она как а то все так его но да ты к у же вы за бы по только
ее мне было вот от меня еще нет о из ему теперь когда даже ну уже или ни до вас
ведь там потом себя ей они тут где есть для мы тебя их чем была без если ли
чтобы был были под над при через после перед между про об во со ко этот эта эти
того потому чтоб опять уж вам ведь ничего может надо сам будто
""".split()

def tokenize(text: str) -> list[str]:
    return [w.lower().replace("ё", "е") for w in WORD_RE.findall(text)]


def fw_vector(text: str) -> tuple[list[float], int]:
    tw = tokenize(text)
    n = max(len(tw), 1)
    c = Counter(tw)
    return [c.get(w, 0) / n for w in FUNCTION_WORDS], len(tw)


def corpus_stats(vectors: list[list[float]]) -> tuple[list[float], list[float]]:
    means = [statistics.mean(col) for col in zip(*vectors)]
    stds = [
        statistics.pstdev(col) if len(col) > 1 and statistics.pstdev(col) > 1e-12 else 1.0
        for col in zip(*vectors)
    ]
    return means, stds


def burrows_delta(v1: list[float], v2: list[float], means: list[float], stds: list[float]) -> float:
    s = n = 0
    for a, b, m, sd in zip(v1, v2, means, stds):
        if sd < 1e-12:
            continue
        s += abs((a - m) / sd - (b - m) / sd)
        n += 1
    return s / max(n, 1)


def top_fw_diffs(
    v1: list[float], v2: list[float], n: int = 12
) -> list[tuple[str, float, float, float]]:
    rows = [
        (FUNCTION_WORDS[i], v1[i], v2[i], abs(v1[i] - v2[i]))
        for i in range(len(FUNCTION_WORDS))
    ]
    rows.sort(key=lambda r: -r[3])
    return rows[:n]


def load_meta(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    rows = json.loads(path.read_text(encoding="utf-8"))
    return {r["slug"]: r for r in rows}


def load_corpus(texts_dir: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for f in sorted(texts_dir.glob("*.txt")):
        if f.name.startswith("_"):
            continue
        out[f.stem] = f.read_text(encoding="utf-8")
    return out


def mds_from_deltas(slugs: list[str], matrix: dict[tuple[str, str], float]) -> dict[str, tuple[float, float]]:
    """Простая 2D-MDS (классическая) по матрице Delta — для scatter."""
    n = len(slugs)
    if n < 3:
        return {s: (0.0, 0.0) for s in slugs}
    d = [[0.0] * n for _ in range(n)]
    for i, a in enumerate(slugs):
        for j, b in enumerate(slugs):
            if i == j:
                continue
            key = (a, b) if a < b else (b, a)
            d[i][j] = matrix.get(key, matrix.get((a, b), matrix.get((b, a), 0.0)))
    # double-center squared distances
    d2 = [[x * x for x in row] for row in d]
    mean_row = [sum(row) / n for row in d2]
    mean_col = [sum(d2[i][j] for i in range(n)) / n for j in range(n)]
    grand = sum(mean_row) / n
    b = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            b[i][j] = -0.5 * (d2[i][j] - mean_row[i] - mean_col[j] + grand)
    # power iteration for top-2 eigenvectors (small n=37)
    def mat_vec(m, v):
        return [sum(m[i][j] * v[j] for j in range(n)) for i in range(n)]

    def norm(v):
        return math.sqrt(sum(x * x for x in v)) or 1.0

    v1 = [1.0] * n
    for _ in range(80):
        v1 = mat_vec(b, v1)
        v1 = [x / norm(v1) for x in v1]
    bv1 = mat_vec(b, v1)
    l1 = sum(v1[i] * bv1[i] for i in range(n))
    # deflate
    b2 = [[b[i][j] - l1 * v1[i] * v1[j] for j in range(n)] for i in range(n)]
    v2 = [1.0 if i % 2 else -1.0 for i in range(n)]
    for _ in range(80):
        v2 = mat_vec(b2, v2)
        v2 = [x / norm(v2) for x in v2]
    bv2 = mat_vec(b2, v2)
    l2 = max(sum(v2[i] * bv2[i] for i in range(n)), 1e-9)
    coords = {}
    for i, slug in enumerate(slugs):
        x = math.sqrt(max(l1, 0)) * v1[i]
        y = math.sqrt(max(l2, 0)) * v2[i]
        coords[slug] = (x, y)
    return coords


def esc(x) -> str:
    return html.escape(str(x))
