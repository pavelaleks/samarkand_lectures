# -*- coding: utf-8 -*-
"""
Пересобирает краткие содержания курса «Имагология» (src/data/imagology/лекции/N.html и N.json):
применяет правки из lectures_src.py и добавляет блоки «Запад ↔ Россия», «Цифровой ход», «Практическое занятие»,
дополнительный вопрос и западную литературу. Повторный запуск безопасен: прежние блоки заменяются.

    python scripts/imagology/build_lectures.py
"""
import html
import json
import os
import re
import sys

from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DIR = os.path.join(ROOT, "src", "data", "imagology", "лекции")
sys.path.insert(0, HERE)
import lectures_src as S  # noqa: E402

PAIR_TITLES = {}
try:
    import presets_src as P  # noqa: E402
    PAIR_TITLES = {p["id"]: p["title"] for p in P.PAIRS}
except Exception:  # noqa: BLE001
    pass


def href(h):
    return h if h.startswith("/") or h.startswith("http") else S.LAB + h


def block_west(text, pair):
    links = ""
    if pair:
        title = PAIR_TITLES.get(pair, "пара текстов")
        links = (f'<p class="imago-links"><a href="{S.LAB}parallel.html?pair={pair}">Открыть пару в Параллельном читателе →</a>'
                 f' <span class="imago-muted">«{html.escape(title)}»</span></p>')
    return f'<div class="imago-block imago-west"><h2>Запад ↔ Россия</h2><p>{html.escape(text)}</p>{links}</div>'


def block_dh(items):
    lis = "".join(f'<li><a href="{href(h)}">{html.escape(lbl)}</a> — {html.escape(txt)}</li>' for h, lbl, txt in items)
    return (f'<div class="imago-block imago-dh"><h2>Цифровой ход</h2><ul>{lis}</ul>'
            f'<p class="imago-muted">Стенды работают в браузере на текстах Викитеки. Все стенды и блокноты Colab — в <a href="{S.LAB}index.html">Лаборатории имагологии</a>.</p></div>')


def block_task(n):
    if not n:
        return ""
    return (f'<div class="imago-block imago-task"><h2>Практическое занятие</h2>'
            f'<p><a href="{S.LAB}practicum.html#p{n}">Практическое {n}. {html.escape(S.PRACTICUM[n])}</a> — ход работы по шагам, что сдать и как оценивается. '
            f'Результат ложится в сквозное задание <a href="{S.LAB}practicum.html#dosye">«Досье одного образа»</a>.</p></div>')


def parse(path):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    for d in soup.select("div.imago-block"):
        d.decompose()
    secs, cur = {"_title": None}, None
    for el in soup.contents:
        if getattr(el, "name", None) is None:
            continue
        if el.name == "h2":
            if secs["_title"] is None:
                secs["_title"] = el.get_text()
                continue
            cur = el.get_text().strip()
            secs[cur] = []
            continue
        if cur:
            secs[cur].append(el)
    return secs


def render(title, summary_html, keep_html, west, dh, task, questions, lit_intro, lit_items):
    q = "".join(f"<li>{html.escape(x)}</li>" for x in questions)
    lit = "".join(f"<li>{x}</li>" for x in lit_items)
    return (f"<h2>{html.escape(title)}</h2>\n<h2>Краткое содержание</h2>\n{summary_html}\n"
            f"<h2>Что важно удержать</h2><ul>\n{keep_html}\n</ul>\n{west}\n{dh}\n{task}\n"
            f"<h2>Вопросы для закрепления</h2><ol>\n{q}\n</ol>\n<h2>Литература</h2>\n<p>{html.escape(lit_intro)}</p><ol>\n{lit}\n</ol>\n")


LIT_INTRO = "Полные тексты в открытом доступе. Сначала теория и русские тексты, затем западная параллель."


def strip_num(s):
    return re.sub(r"^\s*\d+\.\s*", "", s).strip()


def build_existing(n, cfg):
    hp, jp = os.path.join(DIR, f"{n}.html"), os.path.join(DIR, f"{n}.json")
    secs = parse(hp)
    raw_title = secs["_title"]
    summary = "\n".join(str(x) for x in secs.get("Краткое содержание", []))
    for a, b in cfg.get("fix", []):
        if a in summary:
            summary = summary.replace(a, b)
        elif a in raw_title:
            pass
        elif b not in summary and b not in raw_title:
            raise SystemExit(f"лекция {n}: не найдено для замены: {a[:60]}")
    title = (cfg.get("title") or raw_title).rstrip(".")
    keep = "\n".join(str(li) for ul in secs.get("Что важно удержать", []) for li in ul.find_all("li"))
    questions = [strip_num(li.get_text()) for ul in secs.get("Вопросы для закрепления", []) for li in ul.find_all("li")]
    if cfg.get("q") and cfg["q"] not in questions:
        questions.append(cfg["q"])
    added_urls = {u for _, u, _ in cfg.get("add", [])}
    lit_items = []
    for ul in secs.get("Литература", []):
        if getattr(ul, "name", None) not in ("ul", "ol"):
            continue
        for li in ul.find_all("li"):
            a = li.find("a")
            if a and a.get("href") in added_urls:
                continue
            inner = "".join(str(c) for c in li.contents)
            lit_items.append(re.sub(r"^\s*\d+\.\s*", "", inner))
    for name, url, note in cfg.get("add", []):
        lit_items.append(f'<a href="{html.escape(url)}">{html.escape(name)}</a> — {html.escape(note)}')
    out = render(title, summary, keep, block_west(cfg["west"], cfg.get("pair")), block_dh(cfg["dh"]), block_task(cfg.get("practicum")),
                 questions, LIT_INTRO, lit_items)
    open(hp, "w", encoding="utf-8").write(out)

    j = json.load(open(jp, encoding="utf-8"))
    j["title"] = title + "."
    have = {r["url"] for r in j.get("readings", [])}
    for name, url, _ in cfg.get("add", []):
        if url not in have:
            j["readings"].append({"displayName": name, "url": url})
    json.dump(j, open(jp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return title


def build_18():
    L = S.LECTURE_18
    summary = "\n".join(f"<p>{html.escape(p)}</p>" for p in L["summary"])
    keep = "\n".join(f"<li>{html.escape(x)}</li>" for x in L["keep"])
    lit = [f'<a href="{html.escape(u)}">{html.escape(nm)}</a> — {html.escape(nt)}' for nm, u, nt in L["readings"]]
    title = L["title"].rstrip(".")
    out = render(title, summary, keep, block_west(L["west"], L["pair"]), block_dh(L["dh"]), block_task(L["practicum"]), L["questions"], LIT_INTRO, lit)
    open(os.path.join(DIR, "18.html"), "w", encoding="utf-8").write(out)
    j = {"number": "18", "title": L["title"], "id": "imagology-18",
         "readings": [{"displayName": nm, "url": u} for nm, u, _ in L["readings"]]}
    json.dump(j, open(os.path.join(DIR, "18.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return title


def main():
    for n, cfg in sorted(S.LECTURES.items()):
        t = build_18() if cfg.get("new") else build_existing(n, cfg)
        print(f"{n:2d}. {t}")


if __name__ == "__main__":
    main()
