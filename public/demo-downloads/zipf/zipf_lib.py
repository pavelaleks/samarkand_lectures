# -*- coding: utf-8 -*-
"""
Общие функции для учебного анализа закона Ципфа (лекция 4).
"""

from __future__ import annotations

import math
import re
from collections import Counter
from pathlib import Path

WORD_RE = re.compile(r"[А-Яа-яЁёA-Za-z]+(?:-[А-Яа-яЁёA-Za-z]+)?", re.UNICODE)

SERVICE_WORDS = set(
    """
    и в на с не я она что он как а ее все к за по но меня его от у из о до для
    при без же бы ли да это был была было были ты вы мы нас вас тебя мне мной
    ним ней них их мой моя мое мои свой своя свое свои тот та то те этот эта
    эти чтобы уже только еще есть нет так вот там тут когда где кто чем или
    если ни будто даже ведь лишь почти сам сама само сами себя себе собой под
    над во со ко об про ей ему ими вами нами тобой нее него какая какой какое
    какие нибудь
    """.split()
)

# Тематические «щупы» — не топ частоты, а проверка: есть ли слово в тексте вообще
THEME_PROBES = [
    "любовь",
    "любил",
    "любила",
    "любовью",
    "сад",
    "аллеи",
    "аллея",
    "глаза",
    "ночь",
    "осень",
    "смерть",
    "душа",
    "тело",
    "поцелуй",
    "память",
    "воспоминание",
]


def tokenize(text: str) -> list[str]:
    """Простая токенизация (без лемматизации) — словоформы как в тексте."""
    return [w.lower().replace("ё", "е") for w in WORD_RE.findall(text)]


def is_service(word: str) -> bool:
    return word in SERVICE_WORDS


def fit_zipf_alpha(freqs_desc: list[int], max_rank: int | None = 100) -> dict:
    """OLS в log–log: log10(freq) = c − α · log10(rank)."""
    try:
        import numpy as np
    except ImportError:
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


def pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 3:
        return float("nan")
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    denx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    deny = math.sqrt(sum((y - my) ** 2 for y in ys))
    if denx == 0 or deny == 0:
        return float("nan")
    return num / (denx * deny)


def analyze_text(text: str, top_n: int = 20) -> dict:
    tokens = tokenize(text)
    counts = Counter(tokens)
    freqs = [c for _, c in counts.most_common()]
    n = len(tokens)
    v = len(counts)
    hapax_words = [w for w, c in counts.items() if c == 1]
    hapax = len(hapax_words)
    zipf = fit_zipf_alpha(freqs, max_rank=min(100, len(freqs)))
    top_words = counts.most_common(top_n)
    top_cover = (sum(c for _, c in top_words) / n) if n else 0.0
    content_in_top = [(w, c) for w, c in top_words if not is_service(w)]

    pronouns = {
        "я": counts.get("я", 0),
        "она": counts.get("она", 0),
        "он": counts.get("он", 0),
        "ты": counts.get("ты", 0),
        "мы": counts.get("мы", 0),
    }
    theme_hits = {w: counts.get(w, 0) for w in THEME_PROBES if counts.get(w, 0)}

    # до 15 гапаксов для медленного чтения (стабильный порядок)
    hapax_sample = sorted(hapax_words)[:15]

    return {
        "tokens": n,
        "types": v,
        "ttr": (v / n) if n else 0.0,
        "guiraud": (v / (n**0.5)) if n else 0.0,
        "hapax": hapax,
        "hapax_ratio": (hapax / v) if v else 0.0,
        "top_words": top_words,
        "top20_cover": top_cover,
        "content_in_top": content_in_top,
        "freqs": freqs,
        "counts": counts,
        "alpha": zipf["alpha"],
        "r2": zipf["r2"],
        "n_fit": zipf["n_fit"],
        "intercept": zipf.get("intercept"),
        "pronouns": pronouns,
        "theme_hits": theme_hits,
        "hapax_sample": hapax_sample,
    }


def analyze_file(path: Path, title: str | None = None, top_n: int = 20) -> dict:
    text = path.read_text(encoding="utf-8")
    stats = analyze_text(text, top_n=top_n)
    stats["path"] = str(path)
    stats["title"] = title or path.stem
    stats["slug"] = path.stem
    return stats


def analyze_corpus(texts: list[str], title: str = "весь цикл") -> dict:
    joined = "\n".join(texts)
    stats = analyze_text(joined, top_n=20)
    stats["title"] = title
    stats["slug"] = "_cycle"
    stats["path"] = "(объединение файлов)"
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
        r_line = [1, max(2, len(freqs))]
        f_line = [
            10 ** (stats["intercept"] - stats["alpha"] * math.log10(r)) for r in r_line
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


def plot_alpha_vs_length(rows: list[dict], out_path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    xs = [r["tokens"] for r in rows]
    ys = [r["alpha"] for r in rows]
    fig, ax = plt.subplots(figsize=(8, 5), dpi=140)
    ax.scatter(xs, ys, s=40, c="#0f766e", alpha=0.75)
    for r in rows:
        if r["tokens"] < 500 or r["tokens"] > 5000 or r["alpha"] < 0.55:
            ax.annotate(
                r["title"][:18],
                (r["tokens"], r["alpha"]),
                fontsize=7,
                alpha=0.8,
            )
    ax.set_xlabel("Длина текста N (токены)")
    ax.set_ylabel("α Ципфа")
    ax.set_title("α и длина рассказа: короткий текст → ниже α")
    ax.grid(True, ls=":", alpha=0.4)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path)
    plt.close(fig)


def plot_top20_bars(stats: dict, out_path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    words = list(reversed([w for w, _ in stats["top_words"][:20]]))
    freqs = list(reversed([c for _, c in stats["top_words"][:20]]))
    colors = ["#f59e0b" if not is_service(w) else "#0d9488" for w in words]
    fig, ax = plt.subplots(figsize=(8, 7), dpi=140)
    ax.barh(words, freqs, color=colors)
    ax.set_xlabel("Частота")
    ax.set_title(f"Топ-20 словоформ — {stats.get('title', '')}")
    ax.grid(True, axis="x", ls=":", alpha=0.4)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path)
    plt.close(fig)


def print_report(stats: dict) -> None:
    print("=" * 64)
    print(f"Файл / рассказ: {stats.get('title')}")
    print(f"Путь: {stats.get('path', '—')}")
    print("-" * 64)
    print(f"Токены (N):                    {stats['tokens']}")
    print(f"Типы (V):                      {stats['types']}")
    print(f"TTR = V/N:                     {stats['ttr']:.4f}")
    print(f"Guiraud = V/√N:                {stats['guiraud']:.3f}")
    print(f"Гапаксы:                       {stats['hapax']} ({stats['hapax_ratio']:.1%})")
    print(f"Покрытие топ-20:               {stats['top20_cover']:.1%}")
    print(f"α Ципфа (топ-{stats['n_fit']}):          {stats['alpha']:.4f}")
    print(f"R²:                            {stats['r2']:.4f}")
    pr = stats.get("pronouns") or {}
    if pr:
        print(
            f"Местоимения я/она/он:          {pr.get('я', 0)} / {pr.get('она', 0)} / {pr.get('он', 0)}"
        )
    print("Топ-20 словоформ:")
    for i, (w, c) in enumerate(stats["top_words"][:20], 1):
        tag = "служебн." if is_service(w) else "★ знаменат."
        print(f"  {i:2d}. {w:18s} {c:5d}  {tag}")
    if stats.get("content_in_top"):
        print("Знаменательные в топ-20:", ", ".join(f"{w}({c})" for w, c in stats["content_in_top"]))
    if stats.get("theme_hits"):
        print("Тематические щупы (есть в тексте):", ", ".join(f"{w}={c}" for w, c in stats["theme_hits"].items()))
    print("=" * 64)
    print("Как читать: α≈1 и высокий R² — классический Ципф; топ-20 ≠ тема рассказа.")
    print("=" * 64)
