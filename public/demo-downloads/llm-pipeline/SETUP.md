# Л11 · LLM-конвейер по «Тёмным аллеям» — подробная инструкция

## Что в папке

```
llm_bunin/
  run_pipeline.py        # тексты → промпт → DeepSeek → CSV
  geocode_places.py      # топонимы → Photon/OSM → places.csv (без ключа)
  wikidata_place.py      # Wikidata SPARQL: Q-id / координаты / страна
  json_to_csv.py         # пересобрать CSV из output/raw без новых запросов
  requirements.txt       # openai>=1.0.0 (DeepSeek совместим с OpenAI SDK)
  .env.example           # шаблон ключа → скопировать в .env
  prompts/               # контракты измерения, по одному на гипотезу
    irony_v1.md · memory_v1.md · space_v1.md · voice_v1.md · time_v1.md
    irony_leading_v0.md  # АНТИПРИМЕР: наводящий промпт
  sample_texts/          # 8 рассказов цикла (UTF-8)
  stories_meta.json
  notes/audit_template.md
  output/                # raw/, tables/, errors/ (+ raw/geo/ для геокодера)
  CLAUDE_PROMPT_PACK.md
```

## Открытые API (дополнение к DeepSeek)

На сайте: вкладка **«Другие API»** — пошаговое демо без ключа.

```bash
python geocode_places.py                 # учебный список топонимов цикла
python geocode_places.py --query "Nice"
python wikidata_place.py Paris
```

Стыковка: LLM даёт `place_mentions` / тезисы о пространстве → геокодер даёт lat/lon → аудит обеих таблиц. Карта не доказывает поэтику места.

## 1. Окружение

1. Установите Python 3.10+ (python.org) и PyCharm Community.
2. Распакуйте ZIP в `Documents/llm_bunin`.
3. PyCharm → **Open** → папка → внизу справа *Add interpreter* → **Virtualenv**.
4. Terminal (внизу PyCharm):

```bash
python -m pip install -r requirements.txt
```

## 2. Ключ

1. https://platform.deepseek.com → API keys → Create. Пополните баланс (нескольких долларов хватит на семестр).
2. Скопируйте `.env.example` в `.env` и впишите ключ:

```
DEEPSEEK_API_KEY=sk-ваш-ключ
```

3. **Никогда** не вписывайте ключ в `.py`, не выкладывайте `.env` на GitHub, не отправляйте в чат. Утёкший ключ — удалите на platform.deepseek.com и создайте новый.

## 3. Запуск

```bash
python run_pipeline.py --dry-run                       # показать запрос, ничего не отправлять
python run_pipeline.py                                 # 5 рассказов × начало, irony_v1
python run_pipeline.py --prompt prompts/space_v1.md    # другая гипотеза
python run_pipeline.py --position end --max-chars 2500 # финалы
python run_pipeline.py --stories all --position all    # все 8 рассказов целиком кусками
python run_pipeline.py --limit 2                       # пилот на 2 фрагментах
```

В PyCharm можно и кнопкой Run: *Run → Edit Configurations → Parameters* — впишите, например, `--prompt prompts/memory_v1.md --position end`.

## 4. Как читать результат

| Колонка | Что значит |
|---|---|
| `thesis`, `quotes` | кандидат-наблюдение и дословные опоры |
| `confidence` | очередь проверки, а не истина |
| `problems` | автоматические проверки: нет ключей, цитата не из текста, тезис без цитаты |
| `quotes_not_in_source` | > 0 → стоп-сигнал, строка почти наверняка брак |
| `audit` | заполняете **вы**: pass / fail |

## 5. Аудит (обязательно)

1. Все строки с непустым `problems`.
2. Все строки с `confidence ≥ 0.85`.
3. Ещё 10% случайных строк.
4. Протокол — в `notes/audit_template.md`.

Только после этого — выводы и графики (Л12).

## 6. Своя гипотеза

1. Скопируйте `prompts/irony_v1.md` → `prompts/my_feature_v1.md`.
2. Поменяйте вопрос, операционализацию, специальные поля (строки `- "ключ": описание` — скрипт сам считает их обязательными), flags и правило честного нуля.
3. Пилот: `--limit 2`, смотрите `output/raw/`. Правите промпт → **новая версия файла** (`_v2.md`), старую не перезаписывайте.

## 7. Частые ошибки

| Симптом | Причина |
|---|---|
| `Нет DEEPSEEK_API_KEY` | нет файла `.env` или он назван `.env.txt` |
| `401` | ключ скопирован не полностью |
| `402 Insufficient Balance` | пополните баланс |
| `ModuleNotFoundError: openai` | PyCharm использует не тот интерпретатор: Settings → Python Interpreter |
| Кракозябры в Excel | открывайте через «Данные → Из текста/CSV», кодировка UTF-8 |
| Модель «нашла» приём везде | промпт без честного нуля — сравните с `irony_leading_v0.md` |

## 8. Другой провайдер

Код OpenAI-совместимый. Для другого сервиса поменяйте в `.env` `DEEPSEEK_BASE_URL` и `DEEPSEEK_MODEL` (ключ — того же провайдера). Модель и дату **запишите в лог**.
