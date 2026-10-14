#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ПОЛНАЯ ЛАБОРАТОРНАЯ · Закон Ципфа по «Тёмным аллеям»

Новичкам в PyCharm:
  1) Откройте этот файл
  2) Нажмите зелёный Run (параметры не нужны)
  3) Смотрите папку out/ — там Excel, CSV, HTML-отчёт и графики

Что получите (больше, чем на сайте-уроке):
  • метрики по всем рассказам из sample_texts/ + весь цикл целиком
  • топ-20 словоформ по каждому рассказу и по циклу
  • Excel-книгу с несколькими листами
  • CSV для Excel / Numbers / Google Sheets
  • HTML-отчёт (открывается в браузере; Word → Открыть тоже читает)
  • графики: Ципф цикла, топ-20 цикла, α vs длина + 5 витринных рассказов
  • «детектив»: имена в топе, местоимения, тематические щупы, гапаксы для чтения

Все PNG по 37 рассказам (дольше):
  Parameters → --all-plots
"""

from __future__ import annotations

import csv
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from zipf_lib import (
    analyze_corpus,
    analyze_file,
    is_service,
    pearson,
    plot_alpha_vs_length,
    plot_top20_bars,
    plot_zipf,
)

OUT = ROOT / "out"
TEXTS_DIR = ROOT / "sample_texts"
META_PATH = ROOT / "stories_meta.json"


def load_meta() -> dict[str, dict]:
    if not META_PATH.exists():
        return {}
    rows = json.loads(META_PATH.read_text(encoding="utf-8"))
    return {r["slug"]: r for r in rows}


def collect_txts() -> list[Path]:
    files = sorted(TEXTS_DIR.glob("*.txt"))
    return [f for f in files if not f.name.startswith("_")]


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore", delimiter=";")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_excel(path: Path, sheets: dict[str, tuple[list[str], list[dict]]]) -> None:
    """Несколько листов. Нужен openpyxl (есть в requirements.txt)."""
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
        for col in ws.columns:
            maxlen = min(40, max(len(str(c.value or "")) for c in col))
            ws.column_dimensions[col[0].column_letter].width = max(10, maxlen + 2)
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def write_html_report(
    path: Path,
    cycle: dict,
    stories: list[dict],
    corr: float,
    findings: list[str],
) -> None:
    def esc(x):
        return html.escape(str(x))

    rows_html = []
    for s in stories:
        rows_html.append(
            "<tr>"
            f"<td>{s.get('order', '')}</td>"
            f"<td>{esc(s['title'])}</td>"
            f"<td>{s['tokens']}</td>"
            f"<td>{s['alpha']:.3f}</td>"
            f"<td>{s['r2']:.3f}</td>"
            f"<td>{s['hapax_ratio']:.1%}</td>"
            f"<td>{s['top20_cover']:.1%}</td>"
            f"<td>{esc(', '.join(f'{w}({c})' for w,c in s.get('content_in_top') or []))}</td>"
            "</tr>"
        )

    top_cycle = "".join(
        f"<li><code>{esc(w)}</code> — {c}"
        f"{'' if is_service(w) else ' <strong>★</strong>'}</li>"
        for w, c in cycle["top_words"][:20]
    )

    findings_html = "".join(f"<li>{esc(x)}</li>" for x in findings)

    body = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Отчёт · Ципф · Тёмные аллеи</title>
<style>
body {{ font-family: Georgia, 'Times New Roman', serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }}
h1,h2 {{ font-family: system-ui, sans-serif; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ border: 1px solid #ccc; padding: 6px 8px; text-align: left; }}
th {{ background: #f0f7f6; }}
code {{ background: #f4f4f4; padding: 1px 4px; }}
.note {{ background: #f7faf9; border-left: 4px solid #0d9488; padding: 0.8rem 1rem; }}
.warn {{ background: #fff7ed; border-left: 4px solid #f59e0b; padding: 0.8rem 1rem; }}
</style>
</head>
<body>
<h1>Лабораторная: закон Ципфа в «Тёмных аллеях»</h1>
<p>Собрано скриптом <code>zipf_lab.py</code>. Откройте этот файл в браузере или в Word (Файл → Открыть).</p>

<div class="note">
<strong>Цикл целиком:</strong> N={cycle['tokens']}, V={cycle['types']},
α={cycle['alpha']:.4f}, R²={cycle['r2']:.4f},
покрытие топ-20={cycle['top20_cover']:.1%},
гапаксы={cycle['hapax_ratio']:.1%}.
Корреляция длины и α по рассказам ≈ {corr:.2f}.
</div>

<h2>Топ-20 словоформ цикла</h2>
<ol>{top_cycle}</ol>
<p class="warn">Почти всё в топе — служебные слова и местоимения.
Тема любви / сада / смерти сюда обычно <em>не</em> попадает: частотный пик ≠ смысловой пик.</p>

<h2>Что нашёл «детектив» (интересно для семинара)</h2>
<ul>{findings_html}</ul>

<h2>Все рассказы</h2>
<table>
<thead><tr>
<th>#</th><th>Рассказ</th><th>N</th><th>α</th><th>R²</th><th>гапаксы</th><th>топ-20 %</th><th>★ в топ-20</th>
</tr></thead>
<tbody>
{''.join(rows_html)}
</tbody>
</table>

<h2>Как читать результат</h2>
<ul>
<li>α≈1 и высокий R² на длинных текстах и на цикле — нормальный естественный язык.</li>
<li>Низкая α у миниатюр — чаще эффект длины, не «другой автор».</li>
<li>Имена в топ-20 (натали, генрих…) — приглашение смотреть композицию повтора имени.</li>
<li>Гапаксы в файле <code>hapax_samples.csv</code> — материал для медленного чтения детали.</li>
</ul>

<p>Файлы рядом: <code>zipf_bunin.xlsx</code>, <code>metrics.csv</code>, <code>top20_*.csv</code>, папка <code>plots/</code>.</p>
</body>
</html>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def detective_findings(cycle: dict, stories: list[dict], corr: float) -> list[str]:
    findings = []
    findings.append(
        f"На всём цикле топ-20 покрывает {cycle['top20_cover']:.0%} текста — "
        "четверть книги на крошечном служебном каркасе."
    )
    findings.append(
        f"Корреляция N и α ≈ {corr:.2f}: чем длиннее рассказ, тем обычно выше α."
    )

    named = []
    for s in stories:
        for w, c in s.get("content_in_top") or []:
            if w[:1].isalpha() and not is_service(w) and c >= 5:
                named.append((s["title"], w, c))
    named.sort(key=lambda x: -x[2])
    for title, w, c in named[:8]:
        findings.append(f"В «{title}» в топ-20 вошло «{w}» ({c} раз) — след героя/мотива.")

    short = min(stories, key=lambda s: s["tokens"])
    long = max(stories, key=lambda s: s["tokens"])
    findings.append(
        f"Самый короткий: «{short['title']}» (N={short['tokens']}, α={short['alpha']:.2f}); "
        f"самый длинный: «{long['title']}» (N={long['tokens']}, α={long['alpha']:.2f})."
    )

    # themes rare in top but present
    theme_anywhere = sorted(
        {(w, c) for s in stories for w, c in (s.get("theme_hits") or {}).items()},
        key=lambda x: -x[1],
    )
    if theme_anywhere:
        top_themes = ", ".join(f"{w}×{c}" for w, c in theme_anywhere[:10])
        findings.append(
            f"Тематические щупы встречаются в текстах, но почти никогда не в топ-20: {top_themes}."
        )

    pr = cycle.get("pronouns") or {}
    findings.append(
        f"Местоименный каркас цикла: я={pr.get('я', 0)}, она={pr.get('она', 0)}, "
        f"он={pr.get('он', 0)} — нарратив «я / она / он» держит любовную новеллу."
    )
    return findings


def main() -> None:
    print("Лабораторная Ципфа · старт…")
    files = collect_txts()
    if not files:
        print(f"Нет .txt в {TEXTS_DIR}", file=sys.stderr)
        sys.exit(1)

    meta = load_meta()
    stories: list[dict] = []
    raw_texts: list[str] = []

    for path in files:
        m = meta.get(path.stem, {})
        title = m.get("title") or path.stem
        stats = analyze_file(path, title=title)
        stats["order"] = m.get("order", "")
        stats["part"] = m.get("part", "")
        stories.append(stats)
        raw_texts.append(path.read_text(encoding="utf-8"))
        print(
            f"  [{len(stories):2d}/{len(files)}] {title:28s}  "
            f"N={stats['tokens']:5d}  α={stats['alpha']:.3f}  R²={stats['r2']:.3f}"
        )

    # порядок как в книге, если есть meta
    stories.sort(key=lambda s: (s.get("order") or 999, s["title"]))

    cycle = analyze_corpus(raw_texts, title="Тёмные аллеи (весь цикл)")
    corr = pearson(
        [s["tokens"] for s in stories],
        [s["alpha"] for s in stories],
    )
    findings = detective_findings(cycle, stories, corr)

    OUT.mkdir(parents=True, exist_ok=True)
    plots = OUT / "plots"
    plots.mkdir(parents=True, exist_ok=True)

    # --- графики ---
    # По умолчанию: цикл + α vs длина + 5 «витринных» рассказов (быстро).
    # Все 37 PNG: Parameters → --all-plots
    all_plots = "--all-plots" in sys.argv
    showcase = {
        "kamarg",
        "chasovnya",
        "holodnaya-osen",
        "chistyj-ponedelnik",
        "natali",
    }
    print("Строю графики…" + (" (все рассказы)" if all_plots else " (цикл + 5 витринных; --all-plots для всех)"))
    plot_zipf(cycle, plots / "cycle_zipf.png", title="Ципф · весь цикл")
    plot_top20_bars(cycle, plots / "cycle_top20.png")
    plot_alpha_vs_length(stories, plots / "alpha_vs_length.png")

    for s in stories:
        if not all_plots and s["slug"] not in showcase:
            continue
        slug = s["slug"]
        plot_zipf(s, plots / f"{slug}_zipf.png", title=f"Ципф — {s['title']}")
        plot_top20_bars(s, plots / f"{slug}_top20.png")

    # --- таблицы ---
    metric_fields = [
        "order",
        "part",
        "title",
        "slug",
        "tokens",
        "types",
        "ttr",
        "guiraud",
        "hapax",
        "hapax_ratio",
        "top20_cover",
        "alpha",
        "r2",
        "ya",
        "ona",
        "on",
        "content_top",
    ]
    metric_rows = []
    for s in stories:
        pr = s.get("pronouns") or {}
        metric_rows.append(
            {
                **s,
                "ya": pr.get("я", 0),
                "ona": pr.get("она", 0),
                "on": pr.get("он", 0),
                "content_top": ", ".join(f"{w}:{c}" for w, c in (s.get("content_in_top") or [])),
                "ttr": round(s["ttr"], 4),
                "guiraud": round(s["guiraud"], 3),
                "hapax_ratio": round(s["hapax_ratio"], 4),
                "top20_cover": round(s["top20_cover"], 4),
                "alpha": round(s["alpha"], 4),
                "r2": round(s["r2"], 4),
            }
        )

    # cycle row
    prc = cycle.get("pronouns") or {}
    cycle_row = {
        "order": 0,
        "part": "",
        "title": cycle["title"],
        "slug": "_cycle",
        "tokens": cycle["tokens"],
        "types": cycle["types"],
        "ttr": round(cycle["ttr"], 4),
        "guiraud": round(cycle["guiraud"], 3),
        "hapax": cycle["hapax"],
        "hapax_ratio": round(cycle["hapax_ratio"], 4),
        "top20_cover": round(cycle["top20_cover"], 4),
        "alpha": round(cycle["alpha"], 4),
        "r2": round(cycle["r2"], 4),
        "ya": prc.get("я", 0),
        "ona": prc.get("она", 0),
        "on": prc.get("он", 0),
        "content_top": ", ".join(f"{w}:{c}" for w, c in (cycle.get("content_in_top") or [])),
    }

    write_csv(OUT / "metrics.csv", metric_fields, metric_rows + [cycle_row])

    top20_cycle_rows = [
        {
            "rank": i,
            "word": w,
            "freq": c,
            "share": round(c / cycle["tokens"], 5),
            "kind": "service" if is_service(w) else "content",
        }
        for i, (w, c) in enumerate(cycle["top_words"][:20], 1)
    ]
    write_csv(
        OUT / "top20_cycle.csv",
        ["rank", "word", "freq", "share", "kind"],
        top20_cycle_rows,
    )

    top20_story_rows = []
    for s in stories:
        for i, (w, c) in enumerate(s["top_words"][:20], 1):
            top20_story_rows.append(
                {
                    "title": s["title"],
                    "slug": s["slug"],
                    "rank": i,
                    "word": w,
                    "freq": c,
                    "share": round(c / s["tokens"], 5) if s["tokens"] else 0,
                    "kind": "service" if is_service(w) else "content",
                }
            )
    write_csv(
        OUT / "top20_stories.csv",
        ["title", "slug", "rank", "word", "freq", "share", "kind"],
        top20_story_rows,
    )

    hapax_rows = []
    for s in stories:
        for w in s.get("hapax_sample") or []:
            hapax_rows.append({"title": s["title"], "slug": s["slug"], "hapax": w})
    write_csv(OUT / "hapax_samples.csv", ["title", "slug", "hapax"], hapax_rows)

    theme_rows = []
    for s in stories:
        for w, c in (s.get("theme_hits") or {}).items():
            theme_rows.append({"title": s["title"], "slug": s["slug"], "theme_word": w, "freq": c})
    write_csv(OUT / "theme_probes.csv", ["title", "slug", "theme_word", "freq"], theme_rows)

    findings_rows = [{"n": i, "finding": t} for i, t in enumerate(findings, 1)]

    # Excel
    print("Пишу Excel…")
    try:
        write_excel(
            OUT / "zipf_bunin.xlsx",
            {
                "metrics": (metric_fields, metric_rows + [cycle_row]),
                "top20_cycle": (["rank", "word", "freq", "share", "kind"], top20_cycle_rows),
                "top20_stories": (
                    ["title", "slug", "rank", "word", "freq", "share", "kind"],
                    top20_story_rows,
                ),
                "hapax_samples": (["title", "slug", "hapax"], hapax_rows),
                "theme_probes": (["title", "slug", "theme_word", "freq"], theme_rows),
                "detective": (["n", "finding"], findings_rows),
            },
        )
        excel_ok = True
    except ImportError:
        excel_ok = False
        print(
            "openpyxl не установлен — Excel пропущен. В Terminal:\n"
            "  python -m pip install -r requirements.txt",
            file=sys.stderr,
        )

    write_html_report(OUT / "report.html", cycle, stories, corr, findings)

    # --- консоль ---
    print()
    print("=" * 64)
    print("ГОТОВО · откройте папку out/")
    print("=" * 64)
    print(f"Рассказов:     {len(stories)}")
    print(f"Цикл α / R²:   {cycle['alpha']:.4f} / {cycle['r2']:.4f}")
    print(f"Корр. N–α:     {corr:.3f}")
    print()
    print("Файлы:")
    if excel_ok:
        print(f"  Excel:  {OUT / 'zipf_bunin.xlsx'}")
    print(f"  HTML:   {OUT / 'report.html'}  ← отчёт (браузер или Word)")
    print(f"  CSV:    metrics.csv, top20_cycle.csv, top20_stories.csv,")
    print(f"          hapax_samples.csv, theme_probes.csv")
    print(f"  PNG:    {plots}/  (цикл + каждый рассказ)")
    print()
    print("Детектив:")
    for line in findings:
        print(f"  • {line}")
    print("=" * 64)


if __name__ == "__main__":
    main()
