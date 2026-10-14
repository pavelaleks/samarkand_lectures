#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Закон Ципфа для ОДНОГО рассказа.

Как запускать новичкам в PyCharm:
  1) Откройте этот файл
  2) Нажмите зелёный треугольник Run
  3) Смотрите числа в консоли и график в папке out/

По умолчанию анализируется:
  sample_texts/holodnaya-osen.txt
и график сохраняется в:
  out/holodnaya-osen_zipf.png

Другой рассказ (Parameters в Run Configuration), примеры:
  sample_texts/chasovnya.txt
  sample_texts/natali.txt --plot out/natali_zipf.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from zipf_lib import analyze_file, plot_zipf, print_report

DEFAULT_TXT = ROOT / "sample_texts" / "holodnaya-osen.txt"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Анализ закона Ципфа для одного текстового файла (.txt)."
    )
    parser.add_argument(
        "txt",
        nargs="?",
        type=Path,
        default=DEFAULT_TXT,
        help="Путь к .txt (по умолчанию sample_texts/holodnaya-osen.txt)",
    )
    parser.add_argument(
        "--plot",
        nargs="?",
        const="AUTO",
        default="AUTO",
        help="PNG-график. Без значения — автоматически в out/<имя>_zipf.png. "
        "Передайте --no-plot чтобы не строить график.",
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Не сохранять график",
    )
    args = parser.parse_args()

    path = args.txt.expanduser()
    if not path.is_absolute():
        path = (ROOT / path).resolve()
    else:
        path = path.resolve()

    if not path.exists():
        print(f"Файл не найден: {path}", file=sys.stderr)
        print("Проверьте, что папка sample_texts лежит рядом с этим скриптом.", file=sys.stderr)
        sys.exit(1)

    stats = analyze_file(path)
    print_report(stats)

    if args.no_plot:
        return

    if args.plot == "AUTO" or args.plot is None:
        out_path = ROOT / "out" / f"{path.stem}_zipf.png"
    else:
        out_path = Path(args.plot)
        if not out_path.is_absolute():
            out_path = (ROOT / out_path).resolve()

    try:
        plot_zipf(stats, out_path, title=f"Закон Ципфа — {path.stem}")
        print(f"График сохранён: {out_path}")
    except ImportError:
        print(
            "Числа посчитаны, но для графика нужны пакеты.\n"
            "В Terminal PyCharm выполните:\n"
            "  python -m pip install -r requirements.txt\n"
            "или на Mac:\n"
            "  python3 -m pip install -r requirements.txt",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
