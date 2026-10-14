# -*- coding: utf-8 -*-
"""
Общие функции для учебного анализа закона Ципфа.
Можно импортировать из zipf_one_story.py и zipf_several_stories.py.
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

WORD_RE = re.compile(r"[А-Яа-яЁёA-Za-z]+(?:-[А-Яа-яЁёA-Za-z]+)?", re.UNICODE)


def tokenize(text: str) -> list[str]:
    """Простая токенизация для учебных целей (без лемматизации)."""
    return [w.lower().replace("ё", "е") for w in WORD_RE.findall(text)]


def fit_zipf_alpha(freqs_desc: list[int], max_rank: int | None = 100) -> dict:
    """
    Оценка показателя Ципфа α методом наименьших квадратов в log–log.

    Модель: log10(frequency) = c − α · log10(rank)
    Идеал классического Ципфа: α ≈ 1.
    """
    try:
        import numpy as np
    except ImportError:
        # запасной путь без numpy
        return _fit_zipf_pure(freqs_desc, max_rank)

    freqs = list(freqs_desc)
    if max_rank is not None:
        freqs = freqs[:max_rank]
    ranks = list(range(1, len(freqs) + 1))
    if len(ranks) < 5:
        return {"alpha": float("nan"), "r2": float("nan"), "n_fit": len(ranks)}

    x = np.log10(np.array(ranks, dtype=float))
    y = np.log10(np.array(freqs, dtype=float))
    slope, intercept = np.polyfit(x, y, 1)
    y_hat = intercept + slope * x
    ss_res = float(((y - y_hat) ** 2).sum())
    ss_tot = float(((y - y.mean()) ** 2).sum())
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else float("nan")
    return {
        "alpha": float(-slope),
        "intercept": float(intercept),
        "r2": float(r2),
        "n_fit": int(len(ranks)),
    }


def _fit_zipf_pure(freqs_desc: list[int], max_rank: int | None) -> dict:
    import math

    freqs = list(freqs_desc)
    if max_rank is not None:
        freqs = freqs[:max_rank]
    n = len(freqs)
    if n < 5:
        return {"alpha": float("nan"), "r2": float("nan"), "n_fit": n}
    xs = [math.log10(r) for r in range(1, n + 1)]
    ys = [math.log10(f) for f in freqs]
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    var_x = sum((x - mean_x) ** 2 for x in xs)
    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    slope = cov / var_x
    intercept = mean_y - slope * mean_x
    y_hat = [intercept + slope * x for x in xs]
    ss_res = sum((y - yh) ** 2 for y, yh in zip(ys, y_hat))
    ss_tot = sum((y - mean_y) ** 2 for y in ys)
    r2 = 1.0 - ss_res / ss_tot if ss_tot else float("nan")
    return {"alpha": -slope, "intercept": intercept, "r2": r2, "n_fit": n}


def analyze_text(text: str) -> dict:
    tokens = tokenize(text)
    counts = Counter(tokens)
    freqs = [c for _, c in counts.most_common()]
    n = len(tokens)
    v = len(counts)
    hapax = sum(1 for c in freqs if c == 1)
    zipf = fit_zipf_alpha(freqs, max_rank=min(100, len(freqs)))
    return {
        "tokens": n,
        "types": v,
        "ttr": (v / n) if n else 0.0,
        "guiraud": (v / (n**0.5)) if n else 0.0,
        "hapax": hapax,
        "hapax_ratio": (hapax / v) if v else 0.0,
        "top_words": counts.most_common(15),
        "freqs": freqs,
        "alpha": zipf["alpha"],
        "r2": zipf["r2"],
        "n_fit": zipf["n_fit"],
        "intercept": zipf.get("intercept"),
    }


def analyze_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    stats = analyze_text(text)
    stats["path"] = str(path)
    stats["title"] = path.stem
    return stats


def plot_zipf(stats: dict, out_path: Path, title: str | None = None) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    freqs = stats["freqs"]
    ranks = list(range(1, len(freqs) + 1))
    fig, ax = plt.subplots(figsize=(7, 5), dpi=140)
    ax.scatter(ranks, freqs, s=14, alpha=0.55, c="#1f3a5f", edgecolors="none", label="наблюдения")
    if stats.get("intercept") is not None and stats["n_fit"] >= 5:
        r_line = [1, len(freqs)]
        f_line = [
            10 ** (stats["intercept"] - stats["alpha"] * __import__("math").log10(r))
            for r in r_line
        ]
        ax.plot(
            r_line,
            f_line,
            color="#8b3a2f",
            lw=2,
            label=f"Ципф α={stats['alpha']:.2f}, R²={stats['r2']:.3f}",
        )
    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlabel("Ранг слова (log)")
    ax.set_ylabel("Частота (log)")
    ax.set_title(title or f"Закон Ципфа — {stats.get('title', '')}")
    ax.grid(True, which="both", ls=":", alpha=0.4)
    ax.legend(loc="upper right")
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path)
    plt.close(fig)


def print_report(stats: dict) -> None:
    print("=" * 60)
    print(f"Файл / рассказ: {stats.get('title')}")
    print(f"Путь: {stats.get('path', '—')}")
    print("-" * 60)
    print(f"Токены (N, словоупотребления): {stats['tokens']}")
    print(f"Типы (V, разные словоформы):   {stats['types']}")
    print(f"TTR = V/N:                     {stats['ttr']:.4f}")
    print(f"Guiraud = V/√N:                {stats['guiraud']:.3f}")
    print(f"Гапаксы (слова с частотой 1):  {stats['hapax']} ({stats['hapax_ratio']:.1%})")
    print(f"α Ципфа (топ-{stats['n_fit']} рангов): {stats['alpha']:.4f}")
    print(f"R² (качество линейности):      {stats['r2']:.4f}")
    print("Топ-10 словоформ:")
    for w, c in stats["top_words"][:10]:
        print(f"  {w:20s} {c}")
    print("=" * 60)
    print("Как читать кратко:")
    print("  α ≈ 1  — классический закон Ципфа")
    print("  R² близко к 1 — точки хорошо ложатся на прямую в log–log")
    print("  высокий % гапаксов — много редких (часто «живописных») слов")
    print("=" * 60)
