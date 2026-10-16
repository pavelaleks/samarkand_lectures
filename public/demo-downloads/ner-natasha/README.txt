NER + Natasha · лаборатория (лекция 6)
======================================

ОБЯЗАТЕЛЬНАЯ ПАПКА:
  Documents/ner_bunin

ГЛАВНЫЙ ФАЙЛ:
  ner_natasha_lab.py  (Run — все тексты в sample_texts/)

С чего начать (порядок в sample_texts/):
  1) temnye-allei.txt   — короткий фрагмент, одно имя
  2) holodnaya-osen.txt — топонимы и «ложные» заглавные
  3) natali.txt         — имя в заглавии
  4) chistyj-ponedelnik.txt — длинный текст

Установка (один раз, Terminal PyCharm):
  python -m pip install -r requirements.txt
  Mac: python3 -m pip install -r requirements.txt

Первый запуск Natasha скачает модели — подождите 1–5 минут.

Без Natasha (сравнение):
  ner_heuristic_lab.py  — только «слова с заглавной», как эвристика на сайте

Выход out/:
  ner_report.html, ner_entities.csv, ner_bunin.xlsx

Стилиометрия (Delta) — лекция 5, другой ZIP.

Сайт:
https://pavelaleks.github.io/samarkand_lectures/courses/digital-humanities/demo/ner
