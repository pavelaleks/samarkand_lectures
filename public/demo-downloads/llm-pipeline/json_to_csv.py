# -*- coding: utf-8 -*-
"""
Пересобрать CSV из сырых ответов output/raw/*.json — без повторных вызовов API.

Зачем: вы поменяли список колонок или нашли ошибку в разборе — заново платить
за модель не нужно, сырые ответы уже сохранены.

    python json_to_csv.py                      # → output/tables/rebuilt.csv
    python json_to_csv.py --out my_table.csv
"""
import argparse
import csv
import json
from pathlib import Path

from run_pipeline import cell, check_row, parse_json

HERE = Path(__file__).resolve().parent
RAW = HERE / "output" / "raw"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=str(HERE / "output" / "tables" / "rebuilt.csv"))
    args = p.parse_args()

    rows = []
    for path in sorted(RAW.glob("*.json")):
        blob = json.loads(path.read_text(encoding="utf-8"))
        frag = blob["fragment"]
        content = blob["response"]["choices"][0]["message"]["content"] or ""
        try:
            data = parse_json(content)
        except Exception as e:
            print(f"!! {path.name}: битый JSON ({e})")
            continue
        keys = list(data.keys())
        problems, n_bad = check_row(data, frag, keys)
        row = {k: cell(v) for k, v in data.items()}
        row.update(title=frag["title"], problems="; ".join(problems), quotes_not_in_source=n_bad,
                   prompt_version=blob.get("prompt_version", ""))
        rows.append(row)

    if not rows:
        print("В output/raw нет ответов — сначала запустите run_pipeline.py")
        return
    fields = []
    for r in rows:
        fields += [k for k in r if k not in fields]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"Готово: {args.out} ({len(rows)} строк)")


if __name__ == "__main__":
    main()
