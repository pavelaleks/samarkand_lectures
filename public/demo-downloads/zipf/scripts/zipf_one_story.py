#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Учебный скрипт: закон Ципфа для ОДНОГО рассказа Бунина.

Пример в PyCharm (Run Configuration → Parameters):
  ../sample_texts/holodnaya-osen.txt

Или из терминала:
  python zipf_one_story.py ../sample_texts/holodnaya-osen.txt
  python zipf_one_story.py ../тексты_цикла/natali.txt --plot out/natali_zipf.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# чтобы импорт работал при запуске из любой папки
sys.path.insert(0, str(Path(__file__).resolve().parent))

from zipf_lib import analyze_file, plot_zipf, print_report


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Анализ закона Ципфа для одного текстового файла (.txt)."
    )
    parser.add_argument(
        "txt",
        type=Path,
        help="Путь к файлу рассказа, например ../sample_texts/holodnaya-osen.txt",
    )
    parser.add_argument(
        "--plot",
        type=Path,
        default=None,
        help="Куда сохранить график PNG (нужны matplotlib и numpy)",
    )
    args = parser.parse_args()

    path = args.txt.expanduser().resolve()
    if not path.exists():
        print(f"Файл не найден: {path}", file=sys.stderr)
        sys.exit(1)

    stats = analyze_file(path)
    print_report(stats)

    if args.plot is not None:
        try:
            plot_zipf(stats, args.plot.resolve(), title=f"Закон Ципфа — {path.stem}")
            print(f"График сохранён: {args.plot.resolve()}")
        except ImportError:
            print(
                "Для графика установите: pip install -r requirements.txt",
                file=sys.stderr,
            )
            sys.exit(2)


if __name__ == "__main__":
    main()
