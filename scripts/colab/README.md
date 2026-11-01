# Генераторы практик Colab (курс DH)

Блокноты `public/demo-downloads/colab-bunin/Para01…Para12*.ipynb` **не редактируются вручную** — они собираются скриптом:

```bash
python scripts/colab/gen_notebooks.py public/demo-downloads/colab-bunin
```

Вся логика (загрузка текстов, лемматизация pymorphy3, поля, ключевые слова, Delta, граф, LDA, OpenAlex, проверка цитат ИИ)
живёт в `public/demo-downloads/colab-bunin/dh_utils.py`. Блокнот скачивает его с сайта в первой ячейке «Подготовка»,
поэтому исправление в `dh_utils.py` сразу доходит до всех 12 пар после деплоя.

Шаблон «Методологический паспорт диссертации» (.docx):

```bash
python scripts/colab/gen_passport.py public/demo-downloads/passport/Metodologicheskij_pasport_dissertacii.docx
```

Данные навигатора «тема → метод» — `src/data/dhMethods.js`.
