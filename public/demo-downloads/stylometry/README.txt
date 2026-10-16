Стилиометрия (Burrows' Delta) · Бунин + Чехов (лекция 5)
=======================================================

ОБЯЗАТЕЛЬНАЯ ПАПКА:
  Documents/stylometry_bunin

ГЛАВНЫЙ ФАЙЛ (Run один раз):
  stylometry_lab.py

После Run смотрите out/:
  stylometry_bunin.xlsx — summary + матрица Delta + витринные пары
  report.html           — три средних: внутри Чехова / Бунина / между
  delta_matrix.csv
  metrics.csv
  plots/mds_authors.png — красный Чехов, бирюзовый Бунин

Файлы:
  sample_texts/           — 37 рассказов Бунина
  sample_texts_chekhov/   — 14 рассказов Чехова
  stories_meta.json
  chekhov_meta.json
  stylometry_lib.py
  stylometry_one_pair.py

Установка:
  python -m pip install -r requirements.txt

Логика занятия:
  1) средняя Delta внутри Чехова — авторы похожи на себя
  2) средняя Delta внутри Бунина — единство цикла
  3) средняя Delta Чехов↔Бунин — обычно дальше

Natasha (NER) — лекция 6.

Сайт:
https://pavelaleks.github.io/samarkand_lectures/courses/digital-humanities/demo/delta
