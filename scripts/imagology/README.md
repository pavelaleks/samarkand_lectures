# Курс «Имагология»: данные, лекции, лаборатория

Лаборатория курса — статические страницы в `public/imagology/lab/` (на сайте: `/samarkand_lectures/imagology/lab/`):

| Страница | Что делает |
|---|---|
| `index.html` | вход: стенды, блокноты Colab, пары «Запад ↔ Россия», открытые источники |
| `volkertafel.html` | цифровая Völkertafel: «народ × признак» по двум корпусам, контексты |
| `parallel.html` | параллельный читатель: профили мотивов и признаков, сцена в двух текстах, ключевые слова |
| `karta.html` | карта взгляда: 10 маршрутов, места текста, поиск координат в Wikidata, GeoJSON |
| `galereya.html` | галерея образов Востока: Wikimedia Commons, разметка по кодовой книге |
| `practicum.html` | 9 практических занятий и сквозное задание «Досье одного образа» |

Тексты стенды берут из Викитеки через API (в браузере, CORS), изображения — из Wikimedia Commons, координаты — из Wikidata.
Ничего не хранится на сервере; разметка галереи — в localStorage, переносится файлом JSON.

## Сборка

```bash
python scripts/imagology/build_data.py       # словари, газеттир, пары → public/imagology/lab/data/*.json
python scripts/imagology/build_lectures.py   # краткие содержания 1–18 → src/data/imagology/лекции/*.html, *.json
python scripts/imagology/gen_colab.py public/imagology/lab/colab        # 4 блокнота Colab
python scripts/imagology/gen_dossier.py public/imagology/lab/Dosye_odnogo_obraza.docx
node scripts/process-lectures.js             # индекс лекций (делает и CI)
```

Источники истины:
- `lexicon_src.py` — народы, признаки (рубрики Штирийской таблицы), мотивы на ru/en/fr/de;
- `places_src.py` — газеттир (~150 мест) и упрощённые маршруты;
- `presets_src.py` — тексты, пары «Запад ↔ Россия», серии галереи, кодовая книга;
- `lectures_src.py` — правки кратких содержаний, блоки «Запад ↔ Россия», «Цифровой ход», «Практическое занятие», западная литература; лекция 18.

`build_lectures.py` можно запускать повторно: прежние блоки заменяются, а не дублируются.
Логика блокнотов — в `public/imagology/lab/colab/imago_utils.py` (тот же алгоритм, что в `lab.js`).
