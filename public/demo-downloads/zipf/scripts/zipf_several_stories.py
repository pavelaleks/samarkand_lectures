#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Закон Ципфа для НЕСКОЛЬКИХ рассказов.

Новичкам в PyCharm:
  1) Откройте этот файл
  2) Нажмите Run
  По умолчанию анализируется вся папка sample_texts/,
  таблица пишется в out/table.csv, графики — в out/plots/

Примеры Parameters:
  sample_texts
  sample_texts/kavkaz.txt sample_texts/natali.txt --verbose
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from zipf_lib import analyze_file, plot_zipf, print_report

DEFAULT_INPUT = ROOT / "sample_texts"


def collect_files(inputs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for item in inputs:
        p = item.expanduser()
        if not p.is_absolute():
            p = (ROOT / p).resolve()
        else:
            p = p.resolve()
        if p.is_dir():
            files.extend(sorted(p.glob("*.txt")))
        elif p.is_file():
            files.append(p)
        else:
            print(f"Пропуск (не найдено): {p}", file=sys.stderr)
    return [f for f in files if not f.name.startswith("_")]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Сравнительный анализ Ципфа для нескольких рассказов."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        default=[DEFAULT_INPUT],
        help="Папка или файлы (по умолчанию sample_texts)",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=ROOT / "out" / "table.csv",
        help="Куда сохранить CSV",
    )
    parser.add_argument(
        "--plots",
        type=Path,
        default=ROOT / "out" / "plots",
        help="Папка для PNG",
    )
    parser.add_argument("--no-plots", action="store_true", help="Не строить графики")
    parser.add_argument("--verbose", action="store_true", help="Полный отчёт по каждому тексту")
    args = parser.parse_args()

    files = collect_files(list(args.paths) if args.paths else [DEFAULT_INPUT])
    if not files:
        print("Не найдено ни одного .txt в sample_texts/", file=sys.stderr)
        sys.exit(1)

    rows = []
    plots_dir = None if args.no_plots else args.plots
    if plots_dir is not None and not plots_dir.is_absolute():
        plots_dir = (ROOT / plots_dir).resolve()

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
        if plots_dir is not None:
            try:
                plot_zipf(stats, plots_dir / f"{path.stem}_zipf.png")
            except ImportError:
                print(
                    "Для графиков установите пакеты:\n"
                    "  python -m pip install -r requirements.txt",
                    file=sys.stderr,
                )
                plots_dir = None

    alphas = [r["alpha"] for r in rows if r["alpha"] == r["alpha"]]
    if alphas:
        mean_a = sum(alphas) / len(alphas)
        print("-" * 60)
        print(f"Рассказов: {len(rows)}")
        print(f"Среднее α: {mean_a:.4f}")
        print(
            "Напоминание: у очень коротких текстов α обычно занижен — "
            "сравнивайте тексты похожей длины."
        )

    csv_path = args.csv if args.csv.is_absolute() else (ROOT / args.csv).resolve()
    csv_path.parent.mkdir(parents=True, exist_ok=True)
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
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", delimiter=";")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"CSV сохранён: {csv_path}")
    if plots_dir is not None:
        print(f"Графики в папке: {plots_dir}")


if __name__ == "__main__":
    main()
