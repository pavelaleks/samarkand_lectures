#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Учебный скрипт: закон Ципфа для НЕСКОЛЬКИХ рассказов (папка или список файлов).

Примеры:
  python zipf_several_stories.py ../sample_texts
  python zipf_several_stories.py ../тексты_цикла --csv out/table.csv --plots out/plots
  python zipf_several_stories.py a.txt b.txt c.txt
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from zipf_lib import analyze_file, plot_zipf, print_report


def collect_files(inputs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for item in inputs:
        p = item.expanduser().resolve()
        if p.is_dir():
            files.extend(sorted(p.glob("*.txt")))
        elif p.is_file():
            files.append(p)
        else:
            print(f"Пропуск (не найдено): {p}", file=sys.stderr)
    # не берём сводный файл цикла, если он попал в папку
    return [f for f in files if not f.name.startswith("_")]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Сравнительный анализ Ципфа для нескольких рассказов."
    )
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Папка с .txt и/или отдельные файлы",
    )
    parser.add_argument("--csv", type=Path, default=None, help="Сохранить таблицу CSV")
    parser.add_argument(
        "--plots",
        type=Path,
        default=None,
        help="Папка для PNG-графиков (по одному на рассказ)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Печатать полный отчёт по каждому тексту",
    )
    args = parser.parse_args()

    files = collect_files(args.paths)
    if not files:
        print("Не найдено ни одного .txt", file=sys.stderr)
        sys.exit(1)

    rows = []
    for path in files:
        stats = analyze_file(path)
        rows.append(stats)
        if args.verbose:
            print_report(stats)
        else:
            print(
                f"{stats['title']:28s}  N={stats['tokens']:5d}  "
                f"α={stats['alpha']:.3f}  R²={stats['r2']:.3f}  "
                f"hapax={stats['hapax_ratio']:.1%}"
            )
        if args.plots is not None:
            out = args.plots / f"{path.stem}_zipf.png"
            try:
                plot_zipf(stats, out)
            except ImportError:
                print("Для графиков: pip install -r requirements.txt", file=sys.stderr)
                args.plots = None

    # сводка
    alphas = [r["alpha"] for r in rows if r["alpha"] == r["alpha"]]  # not NaN
    if alphas:
        mean_a = sum(alphas) / len(alphas)
        print("-" * 60)
        print(f"Рассказов: {len(rows)}")
        print(f"Среднее α: {mean_a:.4f}")
        print(
            "Напоминание: у очень коротких текстов α обычно занижен — "
            "сравнивайте тексты похожей длины."
        )

    if args.csv is not None:
        args.csv.parent.mkdir(parents=True, exist_ok=True)
        fields = [
            "title",
            "path",
            "tokens",
            "types",
            "ttr",
            "guiraud",
            "hapax",
            "hapax_ratio",
            "alpha",
            "r2",
        ]
        with args.csv.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", delimiter=";")
            w.writeheader()
            for r in rows:
                w.writerow(r)
        print(f"CSV сохранён: {args.csv.resolve()}")


if __name__ == "__main__":
    main()
