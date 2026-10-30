# -*- coding: utf-8 -*-
"""
Задание 4 (курс «Анализ художественного текста с помощью ИИ…»).

Файл: openalex_bunin.py
Запуск на своём ноутбуке (PyCharm / Cursor / VS Code / терминал):

  1) pip install requests
  2) python openalex_bunin.py

После запуска рядом появится файл:

  openalex_bunin_raw.txt

В Google Colab: вставьте этот код в ячейку, запустите, затем скачайте .txt.

Ключ API (необязательно): https://openalex.org/settings/api
Вставьте в API_KEY. На слайды ключ НЕ копируйте.
"""

from __future__ import annotations

import time
from pathlib import Path

import requests

API = "https://api.openalex.org/works"
API_KEY = ""  # вставьте свой ключ или оставьте пустым
OUT_FILE = Path(__file__).resolve().parent / "openalex_bunin_raw.txt"

# Три фиксированных запроса задания (не меняйте без разрешения преподавателя).
# У A и C — параметр search; у B — filter по заголовку (так меньше «шума»).
QUERIES = [
    {
        "tag": "A_bunin",
        "mode": "search",
        "value": '"Ivan Bunin"',
        "title_ru": "Бунин как объект изучения",
    },
    {
        "tag": "B_dark_avenues",
        "mode": "filter",
        "value": "title.search:Dark Avenues",
        "title_ru": "Работы о цикле / книге Dark Avenues (Тёмные аллеи)",
    },
    {
        "tag": "C_emigre",
        "mode": "search",
        "value": '"Russian emigre literature" OR "Russian émigré literature"',
        "title_ru": "Контекст русской эмигрантской литературы",
    },
]


def fetch(mode: str, value: str, per_page: int = 25) -> dict:
    params = {
        "per-page": per_page,
        "select": (
            "id,doi,display_name,publication_year,cited_by_count,"
            "authorships,primary_topic,type,open_access"
        ),
    }
    if mode == "search":
        params["search"] = value
    elif mode == "filter":
        params["filter"] = value
    else:
        raise ValueError(f"Неизвестный mode: {mode}")
    if API_KEY:
        params["api_key"] = API_KEY
    response = requests.get(API, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def format_work(index: int, work: dict) -> str:
    authors = "; ".join(
        a["author"]["display_name"] for a in (work.get("authorships") or [])
    ) or "—"
    topic = ((work.get("primary_topic") or {}).get("display_name")) or "—"
    oa = (work.get("open_access") or {}).get("is_oa")
    oa_text = "да" if oa else "нет" if oa is False else "—"
    doi = work.get("doi") or "—"
    openalex_id = work.get("id") or "—"
    return (
        f"{index}. {work.get('publication_year') or '—'} | "
        f"цитирований: {work.get('cited_by_count')}\n"
        f"   Название: {work.get('display_name')}\n"
        f"   Авторы: {authors}\n"
        f"   Тема OpenAlex: {topic}\n"
        f"   Тип: {work.get('type') or '—'} | открытый доступ: {oa_text}\n"
        f"   DOI: {doi}\n"
        f"   OpenAlex: {openalex_id}\n"
    )


def main() -> None:
    lines: list[str] = []
    lines.append("OpenAlex — сырая выдача для задания 4 (Бунин / Тёмные аллеи / эмиграция)")
    lines.append("Файл создан скриптом openalex_bunin.py")
    lines.append("Три запроса фиксированы заданием; не меняйте их без разрешения преподавателя.")
    lines.append("")

    for item in QUERIES:
        tag = item["tag"]
        data = fetch(item["mode"], item["value"])
        count = data["meta"]["count"]
        results = data["results"]
        print(f"{tag}: meta.count = {count}; получено {len(results)}")

        lines.append("=" * 72)
        lines.append(f"ЗАПРОС {tag}")
        lines.append(f"тема: {item['title_ru']}")
        lines.append(f"mode = {item['mode']}")
        lines.append(f"value = {item['value']}")
        lines.append(f"meta.count = {count}")
        lines.append(f"в этом файле записей: {len(results)}")
        lines.append("-" * 72)

        for i, work in enumerate(results, start=1):
            lines.append(format_work(i, work))

        lines.append("")
        time.sleep(0.2)

    OUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"сохранено: {OUT_FILE}")


if __name__ == "__main__":
    main()
