# -*- coding: utf-8 -*-
"""
Л11 · LLM-конвейер по циклу И. А. Бунина «Тёмные аллеи»
=========================================================

Что делает скрипт (тот же конвейер, что на сайте курса):

    sample_texts/*.txt  →  фрагменты  →  prompts/<гипотеза>_v1.md  →  DeepSeek API
        →  output/raw/*.json   (сырые ответы — для воспроизводимости)
        →  output/tables/results.csv   (одна строка = один фрагмент)
        →  output/errors/*.txt  (битый JSON, HTTP-ошибки — НЕ чиним молча)

Запуск (PyCharm → Terminal, в папке проекта):

    python run_pipeline.py --dry-run                 # без ключа: показать запрос, ничего не отправлять
    python run_pipeline.py                           # 5 рассказов, начала, гипотеза irony_v1
    python run_pipeline.py --prompt prompts/memory_v1.md --position end
    python run_pipeline.py --stories all --position all   # весь корпус целиком, кусками по --max-chars

Ключ: файл .env рядом со скриптом (см. .env.example). В код ключ НЕ вписывать.
"""
import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEXTS = HERE / "sample_texts"
OUT = HERE / "output"

DEFAULT_STORIES = ["temnye-allei", "holodnaya-osen", "natali", "chistyj-ponedelnik", "kavkaz"]
BASE_KEYS = ["id", "thesis", "quotes", "confidence", "flags"]


# ---------------------------------------------------------------------------
# 1. Настройки и ключ
# ---------------------------------------------------------------------------

def load_env():
    """Мини-загрузчик .env (чтобы не ставить лишний пакет)."""
    env = HERE / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def parse_args():
    p = argparse.ArgumentParser(description="LLM-конвейер по «Тёмным аллеям»")
    p.add_argument("--prompt", default="prompts/irony_v1.md", help="файл промпта (версия = имя файла)")
    p.add_argument("--stories", default=",".join(DEFAULT_STORIES),
                   help="slug через запятую или 'all' — все файлы из sample_texts/")
    p.add_argument("--position", choices=["start", "end", "all"], default="start",
                   help="start — начало рассказа, end — финал, all — весь текст кусками")
    p.add_argument("--max-chars", type=int, default=2000, help="длина фрагмента в знаках")
    p.add_argument("--model", default=os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"))
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--limit", type=int, default=0, help="максимум фрагментов (0 — без лимита)")
    p.add_argument("--dry-run", action="store_true", help="не вызывать API, только показать запрос")
    return p.parse_args()


# ---------------------------------------------------------------------------
# 2. Тексты → фрагменты
# ---------------------------------------------------------------------------

def normalize(raw):
    """Тексты с lib.ru: абзацы через пустую строку, жёсткие переносы внутри абзаца."""
    raw = raw.replace("\r", "")
    m = re.search(r"Главная страница|Поделиться ссылкой", raw)
    if m:
        raw = raw[: m.start()]
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", raw)]
    return "\n\n".join(p for p in paras if p)


def cut_start(text, n):
    if len(text) <= n:
        return text
    head = text[:n]
    cut = max(head.rfind(". "), head.rfind("! "), head.rfind("? "))
    return head[: cut + 1] if cut > n * 0.6 else head


def cut_end(text, n):
    if len(text) <= n:
        return text
    tail = text[-n:]
    m = re.search(r"[.!?…]\s+", tail)
    return tail[m.end():].strip() if m and m.start() < n * 0.4 else tail


def chunks(text, n):
    """Весь текст подряд кусками ~n знаков по границам абзацев."""
    out, buf = [], ""
    for para in text.split("\n\n"):
        if buf and len(buf) + len(para) > n:
            out.append(buf.strip())
            buf = ""
        buf += para + "\n\n"
    if buf.strip():
        out.append(buf.strip())
    return out


def load_titles():
    meta = HERE / "stories_meta.json"
    if meta.exists():
        return {s["slug"]: s["title"] for s in json.loads(meta.read_text(encoding="utf-8"))}
    return {}


def build_fragments(args):
    titles = load_titles()
    if args.stories == "all":
        slugs = sorted(p.stem for p in TEXTS.glob("*.txt"))
    else:
        slugs = [s.strip() for s in args.stories.split(",") if s.strip()]
    frags = []
    for slug in slugs:
        path = TEXTS / f"{slug}.txt"
        if not path.exists():
            print(f"!! нет файла {path} — пропускаю")
            continue
        text = normalize(path.read_text(encoding="utf-8"))
        title = titles.get(slug, slug)
        if args.position == "all":
            for i, part in enumerate(chunks(text, args.max_chars), 1):
                frags.append({"id": f"{slug}_{i:02d}", "title": title, "position": f"часть {i}", "text": part})
        elif args.position == "end":
            frags.append({"id": slug, "title": title, "position": "финал", "text": cut_end(text, args.max_chars)})
        else:
            frags.append({"id": slug, "title": title, "position": "начало", "text": cut_start(text, args.max_chars)})
    return frags[: args.limit] if args.limit else frags


# ---------------------------------------------------------------------------
# 3. Промпт: контракт измерения
# ---------------------------------------------------------------------------

def load_prompt(path):
    """Промпт = system-сообщение. Обязательные ключи берём из строк вида  - "key": ..."""
    text = (HERE / path).read_text(encoding="utf-8").strip()
    keys = re.findall(r'^- "([a-zA-Z0-9_]+)":', text, flags=re.M) or BASE_KEYS
    return text, keys


def user_message(frag):
    return (
        f"fragment_id: {frag['id']}\n"
        f"рассказ: «{frag['title']}» (И. А. Бунин, «Тёмные аллеи»)\n"
        f"часть рассказа: {frag['position']}\n\n"
        f'ТЕКСТ ФРАГМЕНТА:\n"""\n{frag["text"]}\n"""\n\n'
        "Верни JSON по контракту."
    )


# ---------------------------------------------------------------------------
# 4. Вызов модели (DeepSeek совместим с OpenAI SDK)
# ---------------------------------------------------------------------------

def make_client():
    try:
        from openai import OpenAI
    except ImportError:
        sys.exit("Не установлен пакет openai: python -m pip install -r requirements.txt")
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key or key.startswith("sk-xxxx"):
        sys.exit("Нет DEEPSEEK_API_KEY. Скопируйте .env.example → .env и вставьте свой ключ.")
    base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    return OpenAI(api_key=key, base_url=base_url)


def call_model(client, system, user, args):
    resp = client.chat.completions.create(
        model=args.model,
        temperature=args.temperature,
        max_tokens=700,
        response_format={"type": "json_object"},  # гарантирует синтаксис JSON, но не правдивость цитат
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return resp


# ---------------------------------------------------------------------------
# 5. Разбор и проверка ответа
# ---------------------------------------------------------------------------

def parse_json(content):
    s = content.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", s)
    if fence:
        s = fence.group(1)
    s = s[s.find("{"): s.rfind("}") + 1]
    return json.loads(s)


def norm(s):
    s = str(s).lower().replace("ё", "е")
    s = re.sub(r"[«»\"„“”]", '"', s)
    s = re.sub(r"[—–-]", "-", s)
    return re.sub(r"\s+", " ", s).strip().strip('".… ')


def check_row(data, frag, keys):
    """Возвращает список проблем. Пустой список — строка формально чистая (но аудит всё равно нужен!)."""
    problems = []
    missing = [k for k in keys if k not in data]
    if missing:
        problems.append("нет ключей: " + ", ".join(missing))
    quotes = [q for q in (data.get("quotes") or []) if str(q).strip()]
    not_found = [q for q in quotes if norm(q) not in norm(frag["text"])]
    if not_found:
        problems.append(f"цитаты не из текста: {len(not_found)}")
    if data.get("thesis") and not quotes:
        problems.append("тезис без цитаты")
    try:
        c = float(data.get("confidence"))
        if not 0 <= c <= 1:
            problems.append("confidence вне 0..1")
    except (TypeError, ValueError):
        problems.append("confidence не число")
    return problems, len(not_found)


def cell(v):
    if isinstance(v, list):
        return " | ".join(map(str, v))
    if isinstance(v, dict):
        return json.dumps(v, ensure_ascii=False)
    return "" if v is None else v


# ---------------------------------------------------------------------------
# 6. Главный цикл
# ---------------------------------------------------------------------------

def main():
    load_env()
    args = parse_args()
    system, keys = load_prompt(args.prompt)
    prompt_version = Path(args.prompt).stem
    frags = build_fragments(args)
    if not frags:
        sys.exit("Нет фрагментов: проверьте --stories и папку sample_texts/")

    print(f"Промпт: {prompt_version} · ключи: {', '.join(keys)}")
    print(f"Фрагментов: {len(frags)} · модель: {args.model} · temperature: {args.temperature}\n")

    if args.dry_run:
        print("=== SYSTEM ===\n" + system + "\n\n=== USER (первый фрагмент) ===\n" + user_message(frags[0]))
        print("\n--dry-run: запрос не отправлен.")
        return

    client = make_client()
    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    for sub in ("raw", "tables", "errors"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    rows, n_err = [], 0
    for i, frag in enumerate(frags, 1):
        print(f"[{i}/{len(frags)}] {frag['id']} ({len(frag['text'].split())} слов) … ", end="", flush=True)
        try:
            resp = call_model(client, system, user_message(frag), args)
        except Exception as e:  # сеть, 401, 402, 429 …
            n_err += 1
            (OUT / "errors" / f"{frag['id']}.txt").write_text(f"{type(e).__name__}: {e}", encoding="utf-8")
            print(f"ошибка API → output/errors/  ({e})")
            if "401" in str(e) or "402" in str(e):
                sys.exit("Ключ не принят или закончился баланс — дальше идти бессмысленно.")
            continue

        content = resp.choices[0].message.content or ""
        (OUT / "raw" / f"{frag['id']}.json").write_text(
            json.dumps({"fragment": frag, "prompt_version": prompt_version, "response": resp.model_dump()},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        try:
            data = parse_json(content)
        except Exception as e:
            n_err += 1
            (OUT / "errors" / f"{frag['id']}.txt").write_text(f"JSON: {e}\n\n{content}", encoding="utf-8")
            print("битый JSON → output/errors/")
            continue

        problems, n_bad = check_row(data, frag, keys)
        row = {k: cell(data.get(k)) for k in keys}
        row.update(
            title=frag["title"],
            position=frag["position"],
            problems="; ".join(problems),
            quotes_not_in_source=n_bad,
            audit="",  # pass / fail — заполняете вручную после сверки с текстом
            model=resp.model,
            prompt_version=prompt_version,
            temperature=args.temperature,
        )
        rows.append(row)
        print("ok" if not problems else "ПРОВЕРИТЬ: " + "; ".join(problems))
        time.sleep(0.3)

    if rows:
        table = OUT / "tables" / f"results_{prompt_version}_{stamp}.csv"
        latest = OUT / "tables" / "results.csv"
        for path in (table, latest):
            with path.open("w", encoding="utf-8-sig", newline="") as f:  # utf-8-sig — Excel откроет кириллицу
                w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                w.writeheader()
                w.writerows(rows)
        flagged = sum(1 for r in rows if r["problems"])
        print(f"\nГотово: {latest}  ({len(rows)} строк, к проверке {flagged}, ошибок {n_err})")
        print("Дальше: аудит 10% случайных строк + ВСЕ строки с problems и confidence ≥ 0.85.")


if __name__ == "__main__":
    main()
