LLM-конвейер по «Тёмным аллеям» · лаборатория (лекция 11)
==========================================================

ПАПКА: Documents/llm_bunin   (латиница, без пробелов)

ГЛАВНЫЙ ФАЙЛ: run_pipeline.py

1. PyCharm → Open → папка llm_bunin → New Virtualenv (Python 3.10+).

2. Terminal:
     python -m pip install -r requirements.txt
   Mac:
     python3 -m pip install -r requirements.txt

3. Ключ DeepSeek (https://platform.deepseek.com/api_keys):
     скопируйте .env.example → .env
     впишите DEEPSEEK_API_KEY=sk-...
   (на Mac файлы с точкой скрыты в Finder: Cmd+Shift+. или создайте .env прямо в PyCharm)

4. Проверка без ключа и без денег:
     python run_pipeline.py --dry-run

5. Настоящий прогон (5 рассказов, начала, гипотеза «ирония»):
     python run_pipeline.py
   Другая гипотеза и финалы рассказов:
     python run_pipeline.py --prompt prompts/memory_v1.md --position end

6. Результат:
     output/tables/results.csv   — таблица (открывается в Excel)
     output/raw/                 — сырые ответы модели
     output/errors/              — сбои (битый JSON, HTTP-ошибки)

7. Аудит: notes/audit_template.md — 10% случайных строк + все подозрительные.

8. Открытые API (без ключа) — дополнительно к DeepSeek:
     python geocode_places.py
       → output/tables/places.csv   (Photon / OSM: топонимам — координаты)
     python wikidata_place.py Paris
       → Q-id, координаты, страна
   На сайте: вкладка «Другие API» — пошаговое живое демо.

Помощь Claude / Cursor: CLAUDE_PROMPT_PACK.md
Подробно: SETUP.md

Сайт курса (живая демонстрация):
https://pavelaleks.github.io/samarkand_lectures/courses/digital-humanities/demo/pipeline
