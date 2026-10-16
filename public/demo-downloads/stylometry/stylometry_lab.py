#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ПОЛНАЯ ЛАБОРАТОРНАЯ · Стилиометрия (Burrows' Delta) · «Тёмные аллеи»

Новичкам в PyCharm:
  1) Откройте этот файл
  2) Run (параметры не нужны)
  3) Смотрите out/ — Excel, CSV, HTML, графики

Natasha здесь НЕ нужна — NER (Natasha) — лекция 6.

Выход:
  • матрица Delta между всеми рассказами
  • pairwise сравнения (витринные пары + Бунин vs Ахматова)
  • bar charts различий служебных слов
  • scatter MDS «карта» рассказов
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from stylometry_lib import (  # noqa: E402
    AKHMATOVA_VEIL,
    burrows_delta,
    corpus_stats,
    esc,
    fw_vector,
    load_corpus,
    load_meta,
    mds_from_deltas,
    tokenize,
    top_fw_diffs,
)

OUT = ROOT / "out"
TEXTS = ROOT / "sample_texts"
META = ROOT / "stories_meta.json"

SHOWCASE_PAIRS = [
    ("holodnaya-osen", "kavkaz", "Оба Бунин — короткие"),
    ("chistyj-ponedelnik", "natali", "Оба Бунин — длинные"),
    ("holodnaya-osen", "akhmatova-veil", "Бунин vs Ахматова"),
]


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", delimiter=";")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_excel(path: Path, sheets: dict[str, tuple[list[str], list[dict]]]) -> None:
    from openpyxl import Workbook
    from openpyxl.styles import Font

    wb = Workbook()
    wb.remove(wb.active)
    for name, (fields, rows) in sheets.items():
        ws = wb.create_sheet(title=name[:31])
        ws.append(fields)
        for cell in ws[1]:
            cell.font = Font(bold=True)
        for r in rows:
            ws.append([r.get(c, "") for c in fields])
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def plot_fw_bars(slug_a: str, slug_b: str, rows, title: str, path: Path) -> None:
    import matplotlib.pyplot as plt

    words = [r[0] for r in rows[:10]]
    fa = [r[1] * 100 for r in rows[:10]]
    fb = [r[2] * 100 for r in rows[:10]]
    y = range(len(words))
    h = 0.35
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.barh([i - h / 2 for i in y], fa, height=h, label=slug_a, color="#0d9488")
    ax.barh([i + h / 2 for i in y], fb, height=h, label=slug_b, color="#6366f1")
    ax.set_yticks(list(y))
    ax.set_yticklabels(words)
    ax.set_xlabel("Доля токенов, %")
    ax.set_title(title)
    ax.legend(loc="lower right", fontsize=8)
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=120)
    plt.close(fig)


def plot_mds(coords: dict[str, tuple[float, float]], meta: dict, path: Path) -> None:
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(9, 7))
    xs, ys, labels = [], [], []
    for slug, (x, y) in coords.items():
        xs.append(x)
        ys.append(y)
        title = meta.get(slug, {}).get("title", slug)
        if slug == "akhmatova-veil":
            title = "Ахматова"
        labels.append(title)
        color = "#f43f5e" if slug == "akhmatova-veil" else "#0d9488"
        ax.scatter(x, y, c=color, s=40, zorder=3)
    for x, y, lab in zip(xs, ys, labels):
        ax.annotate(lab, (x, y), fontsize=6, alpha=0.85, xytext=(3, 3), textcoords="offset points")
    ax.set_title("MDS по матрице Delta (учебная карта стиля)")
    ax.set_xlabel("ось 1")
    ax.set_ylabel("ось 2")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=120)
    plt.close(fig)


def write_html(
    path: Path,
    meta: dict,
    pair_rows: list[dict],
    matrix_sample: list[dict],
    findings: list[str],
) -> None:
    pair_tr = "".join(
        f"<tr><td>{esc(r['a_title'])}</td><td>{esc(r['b_title'])}</td>"
        f"<td>{r['delta']:.4f}</td><td>{esc(r['label'])}</td></tr>"
        for r in pair_rows
    )
    mat_tr = "".join(
        f"<tr><td>{esc(r['a'])}</td><td>{esc(r['b'])}</td><td>{r['delta']:.4f}</td></tr>"
        for r in matrix_sample[:40]
    )
    findings_li = "".join(f"<li>{esc(x)}</li>" for x in findings)
    body = f"""<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/>
<title>Стилиометрия · Тёмные аллеи</title>
<style>body{{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem}}
table{{border-collapse:collapse;width:100%}} th,td{{border:1px solid #ccc;padding:6px;font-size:13px}}
th{{background:#f0fdfa}}</style></head><body>
<h1>Учебная стилиометрия (Delta)</h1>
<p><strong>Не атрибуция авторства.</strong> Сравниваем профили служебных слов на корпусе Бунина.</p>
<h2>Витринные пары</h2><table><tr><th>A</th><th>B</th><th>Delta</th><th>Комментарий</th></tr>{pair_tr}</table>
<h2>Фрагмент матрицы (ближайшие пары)</h2><table><tr><th>A</th><th>B</th><th>Delta</th></tr>{mat_tr}</table>
<h2>Выводы для семинара</h2><ul>{findings_li}</ul>
<p>Natasha / NER — только лекция 6.</p>
</body></html>"""
    path.write_text(body, encoding="utf-8")


def main() -> None:
    corpus = load_corpus(TEXTS)
    meta = load_meta(META)
    slugs = sorted(corpus.keys())
    vectors: dict[str, list[float]] = {}
    tokens: dict[str, int] = {}
    for slug, text in corpus.items():
        v, n = fw_vector(text)
        vectors[slug] = v
        tokens[slug] = n

    vecs_list = [vectors[s] for s in slugs]
    means, stds = corpus_stats(vecs_list)

    # external contrast
    v_akh, _ = fw_vector(AKHMATOVA_VEIL)
    vectors["akhmatova-veil"] = v_akh
    tokens["akhmatova-veil"] = len(tokenize(AKHMATOVA_VEIL))

    all_slugs = slugs + ["akhmatova-veil"]
    matrix: dict[tuple[str, str], float] = {}
    matrix_rows: list[dict] = []
    for i, a in enumerate(all_slugs):
        for b in all_slugs[i + 1 :]:
            d = burrows_delta(vectors[a], vectors[b], means, stds)
            matrix[(a, b)] = d
            ta = meta.get(a, {}).get("title", "Ахматова" if a == "akhmatova-veil" else a)
            tb = meta.get(b, {}).get("title", "Ахматова" if b == "akhmatova-veil" else b)
            matrix_rows.append({"a": ta, "b": tb, "slug_a": a, "slug_b": b, "delta": round(d, 4)})

    matrix_rows.sort(key=lambda r: r["delta"])

    pair_report: list[dict] = []
    OUT.mkdir(parents=True, exist_ok=True)
    plots = OUT / "plots"
    plots.mkdir(exist_ok=True)

    for sa, sb, label in SHOWCASE_PAIRS:
        if sa not in vectors or sb not in vectors:
            continue
        d = burrows_delta(vectors[sa], vectors[sb], means, stds)
        ta = meta.get(sa, {}).get("title", sa)
        tb = meta.get(sb, {}).get("title", "Ахматова" if sb == "akhmatova-veil" else sb)
        pair_report.append({"a_title": ta, "b_title": tb, "delta": d, "label": label, "slug_a": sa, "slug_b": sb})
        diffs = top_fw_diffs(vectors[sa], vectors[sb])
        plot_fw_bars(
            sa,
            sb,
            diffs,
            f"|Δ| служебных слов: {ta} vs {tb} (Delta={d:.3f})",
            plots / f"{sa}__{sb}_fw.png",
        )
        write_csv(
            OUT / f"diff_{sa}__{sb}.csv",
            ["word", "share_a", "share_b", "abs_diff"],
            [
                {"word": w, "share_a": round(fa, 6), "share_b": round(fb, 6), "abs_diff": round(df, 6)}
                for w, fa, fb, df in diffs
            ],
        )

    coords = mds_from_deltas(slugs, matrix)
    plot_mds(coords, meta, plots / "mds_bunin.png")

    metrics_rows = []
    for slug in slugs:
        m = meta.get(slug, {})
        metrics_rows.append(
            {
                "slug": slug,
                "title": m.get("title", slug),
                "part": m.get("part", ""),
                "tokens": tokens[slug],
                "fw_share_pct": round(sum(vectors[slug]) * 100, 2),
                "mds_x": round(coords.get(slug, (0, 0))[0], 4),
                "mds_y": round(coords.get(slug, (0, 0))[1], 4),
            }
        )

    bunin_deltas = [r["delta"] for r in matrix_rows if "akhmatova" not in r["slug_a"] and "akhmatova" not in r["slug_b"]]
    akh_deltas = [r["delta"] for r in matrix_rows if "akhmatova" in r["slug_a"] or "akhmatova" in r["slug_b"]]
    mean_bunin = sum(bunin_deltas) / max(len(bunin_deltas), 1)
    mean_akh = sum(akh_deltas) / max(len(akh_deltas), 1)

    findings = [
        f"Средняя Delta между рассказами Бунина ≈ {mean_bunin:.3f} — тексты цикла близки по служебному профилю.",
        f"Средняя Delta Бунин vs фрагмент Ахматовой ≈ {mean_akh:.3f} — контраст сильнее, но это не «доказательство авторства».",
        "Большие |Δ| по отдельным словам (в, она, не…) часто отражают местоименную сцену, а не «чужой стиль».",
        "Короткие миниатюры неустойчивы: сравнивайте тексты похожей длины.",
    ]

    write_csv(
        OUT / "delta_matrix.csv",
        ["a", "b", "slug_a", "slug_b", "delta"],
        matrix_rows,
    )
    write_csv(
        OUT / "metrics.csv",
        ["slug", "title", "part", "tokens", "fw_share_pct", "mds_x", "mds_y"],
        metrics_rows,
    )

    try:
        write_excel(
            OUT / "stylometry_bunin.xlsx",
            {
                "metrics": (
                    ["slug", "title", "part", "tokens", "fw_share_pct", "mds_x", "mds_y"],
                    metrics_rows,
                ),
                "pairs_showcase": (
                    ["a_title", "b_title", "delta", "label"],
                    [{k: r[k] for k in ("a_title", "b_title", "delta", "label")} for r in pair_report],
                ),
                "delta_matrix": (
                    ["a", "b", "slug_a", "slug_b", "delta"],
                    matrix_rows,
                ),
            },
        )
    except ImportError:
        print("openpyxl не установлен — Excel пропущен, есть CSV.")

    write_html(OUT / "report.html", meta, pair_report, matrix_rows, findings)

    print("=== Стилиометрия · готово ===")
    print(f"Рассказов: {len(slugs)}")
    print(f"Средняя Delta внутри Бунина: {mean_bunin:.4f}")
    print(f"Средняя Delta Бунин vs Ахматова: {mean_akh:.4f}")
    for r in pair_report:
        print(f"  {r['a_title']} ↔ {r['b_title']}: Delta={r['delta']:.4f}")
    print(f"\nФайлы в {OUT}/")
    for name in sorted(p.name for p in OUT.iterdir() if p.is_file()):
        print(" ", name)
    if plots.exists():
        print(" plots/", ", ".join(sorted(p.name for p in plots.glob("*.png"))))


if __name__ == "__main__":
    main()
