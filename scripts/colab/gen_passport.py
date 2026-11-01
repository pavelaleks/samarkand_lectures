# -*- coding: utf-8 -*-
import sys
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

out = sys.argv[1]
d = Document()
for s in d.sections:
    s.left_margin = s.right_margin = Cm(2); s.top_margin = s.bottom_margin = Cm(2)
st = d.styles["Normal"]; st.font.name = "Times New Roman"; st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
for h in ("Heading 1", "Heading 2"):
    d.styles[h].font.name = "Times New Roman"; d.styles[h].font.color.rgb = RGBColor(0x0F, 0x55, 0x4F)
    d.styles[h].element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

GREY = RGBColor(0x6B, 0x72, 0x80)

def hint(text):
    p = d.add_paragraph(); r = p.add_run(text); r.italic = True; r.font.color.rgb = GREY; r.font.size = Pt(10.5)

def shade(cell, color="E6F4F1"):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), color); tcPr.append(sh)

def table(headers, rows=3, example=None):
    t = d.add_table(rows=1, cols=len(headers)); t.style = "Table Grid"
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]; c.text = ""; r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(10.5); shade(c)
    if example:
        cells = t.add_row().cells
        for i, v in enumerate(example):
            r = cells[i].paragraphs[0].add_run(v); r.italic = True; r.font.color.rgb = GREY; r.font.size = Pt(10)
    for _ in range(rows):
        t.add_row()
    d.add_paragraph()

def kv(pairs):
    t = d.add_table(rows=0, cols=2); t.style = "Table Grid"
    for k, ex in pairs:
        cells = t.add_row().cells
        r = cells[0].paragraphs[0].add_run(k); r.bold = True; r.font.size = Pt(10.5); shade(cells[0])
        cells[0].width = Cm(5.5)
        if ex:
            r2 = cells[1].paragraphs[0].add_run(ex); r2.italic = True; r2.font.color.rgb = GREY; r2.font.size = Pt(10)
    d.add_paragraph()

p = d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("СамГУ им. Ш. Рашидова · «Анализ художественного текста с помощью ИИ и цифровых технологий»"); r.font.size = Pt(10); r.font.color.rgb = GREY
d.add_heading("Методологический паспорт диссертации", 0)
kv([("Магистрант", ""), ("Научный руководитель", ""), ("Тема диссертации", ""), ("Дата / версия", "")])
hint("Серым курсивом — подсказки и образцы на материале Бунина. Удаляйте их и пишите своё. Паспорт заполняется весь семестр: после каждой пары Colab — одна строка или один раздел.")

d.add_heading("1. Вопрос и гипотеза", 1)
kv([("Исследовательский вопрос", "Как в цикле «Тёмные аллеи» соотносятся мотивы любви и памяти?"),
    ("Тип темы (по навигатору)", "мотив / пространство / персонажи / композиция / идиостиль / сопоставление / перевод / интертекст / цикл"),
    ("Гипотеза (до подсчётов)", "В рассказах-воспоминаниях («Холодная осень») поле «память» выражено сильнее, чем в рассказах «настоящего времени»."),
    ("Что будет считаться подтверждением / опровержением", "Частота поля выше в 2+ раза И подтверждена контекстами; иначе — гипотеза уточняется.")])

d.add_heading("2. Материал: паспорт корпуса", 1)
hint("Из пары 3 (Colab). Одна строка = одна единица анализа.")
table(["Единица", "Слов", "Источник файла", "Печатное издание для сверки", "Зачем в работе", "Что исключено"], rows=4,
      example=["Холодная осень", "1094", "сайт курса (bunin-lit.ru)", "Бунин И.А. Собр. соч.: в 9 т. Т. 7. М., 1966", "рассказ-воспоминание", "заглавие"])
hint("Правила очистки и опасное правило (что может выкинуть смысл):")
d.add_paragraph(); d.add_paragraph()

for n in (1, 2):
    d.add_heading(f"3.{n}. Метод {n}", 1)
    kv([("Метод и пара Colab", "Частоты смысловых полей + конкорданс · пара 1" if n == 1 else "Ключевые слова (log-likelihood) · пара 5"),
        ("Какой вопрос решает", ""),
        ("Параметры (чтобы повторить)", "поля: «память» = помнить, вспомнить, вспоминать, память, воспоминание, забыть, прошлое, давно; лемматизация pymorphy3"
            if n == 1 else "фон: остальные 36 рассказов цикла; min_freq = 3; p < 0,001"),
        ("Результат (число / таблица)", ""),
        ("График (вставьте скриншот)", ""),
        ("Цитата-доказательство (по изданию, со страницей)", ""),
        ("Цитата, которая ломает или уточняет результат", ""),
        ("Ограничение метода", "мало вхождений; многозначность; мотив без ключевых слов"),
        ("Вердикт по гипотезе", "подтверждена / уточнена / опровергнута — почему")])

d.add_heading("4. Историография (OpenAlex и др.)", 1)
table(["Работа (автор, год, название)", "Где найдена", "Зачем для главы"], rows=5)
hint("Плюс 3 отвергнутые работы и причина (однофамилец, не по теме, нет доступа).")
d.add_paragraph()

d.add_heading("5. Использование ИИ (протокол)", 1)
kv([("Модель, дата", "DeepSeek (веб-чат, бесплатно), 12.11.2026"),
    ("Задача ИИ", "генерация гипотез по фрагменту / помощь с ошибкой в коде"),
    ("Промпт", ""),
    ("Проверка цитат (пара 12)", "найдено дословно: … · частично: … · не найдено: …"),
    ("Что перешло в работу и после какой проверки", "")])

d.add_heading("6. Формулировки для диссертации и защиты", 1)
kv([("Абзац для раздела «Методология»", "Для проверки гипотезы применены частотный анализ смысловых полей и метод ключевых слов (Google Colab, Python, pymorphy3; параметры — прил. 1). Количественные результаты рассматриваются как гипотезы и проверены анализом контекстов; цитаты приводятся по изданию …"),
    ("Положение, выносимое на защиту (если есть цифровая часть)", ""),
    ("Слайд защиты: что на нём", "график + цитата + одна строка ограничения"),
    ("Ответ на вопрос «Зачем здесь компьютер?»", "")])

d.add_heading("7. Чек-лист перед сдачей главы", 1)
for x in ["У каждого числа есть цитата", "Параметры записаны так, что другой человек повторит подсчёт",
          "Названы ограничения каждого метода", "Цитаты сверены с печатным изданием",
          "Использование ИИ описано в протоколе", "Выводы сформулированы осторожно: «показывает», «согласуется», а не «доказывает»"]:
    d.add_paragraph("☐ " + x)

d.save(out); print("saved", out)
