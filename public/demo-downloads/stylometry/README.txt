Стилиометрия (Burrows' Delta) · полная лаборатория (лекция 5)
=============================================================

ОБЯЗАТЕЛЬНАЯ ПАПКА У ВСЕХ:
  Documents/stylometry_bunin

ГЛАВНЫЙ ФАЙЛ (Run один раз):
  stylometry_lab.py

После Run смотрите out/:
  stylometry_bunin.xlsx — метрики, матрица Delta, витринные пары
  report.html           — отчёт для браузера / Word
  delta_matrix.csv      — все попарные Delta
  metrics.csv           — токены, доля служебных слов, MDS-координаты
  plots/                — bar charts |Δ| служебных слов + карта MDS

Быстрый старт:
  stylometry_one_pair.py — только «Холодная осень» vs «Кавказ»

Файлы:
  stylometry_lib.py     — библиотека (не Run)
  sample_texts/         — 37 рассказов цикла
  stories_meta.json     — названия и части

Установка один раз в Terminal PyCharm:
  python -m pip install -r requirements.txt
  (Mac: python3 -m pip install -r requirements.txt)

Natasha (NER) — лекция 6, здесь не нужна.

Подробная инструкция на сайте:
https://pavelaleks.github.io/samarkand_lectures/courses/digital-humanities/demo/delta
